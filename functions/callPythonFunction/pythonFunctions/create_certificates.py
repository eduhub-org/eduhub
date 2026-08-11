from urllib.request import urlopen
import logging
import requests
from api_clients import EduHubClient, StorageClient, safe_float_convert
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa 


ATTENDANCE_SOURCE_INSTRUCTOR = "INSTRUCTOR"

DEGREE_PROGRAM_TYPE = "DEGREES"
EVENTS_PROGRAM_TYPE = "EVENTS"
# Summing per-course ECTS in binary floats (2.5 + 5 + 5) must not fall short of a
# threshold typed as 12.5.
ECTS_EPSILON = 1e-9


def pick_effective_attendance(attendances):
    """Pick the effective Attendance row from a list of rows for the same
    (user, session). INSTRUCTOR-sourced rows always win over automated rows;
    within the chosen pool, the row with the highest ``id`` wins (handles
    repeated toggles). Returns ``None`` if the list is empty.
    """
    if not attendances:
        return None
    instructor_rows = [
        a for a in attendances if a.get("source") == ATTENDANCE_SOURCE_INSTRUCTOR
    ]
    pool = instructor_rows if instructor_rows else attendances
    return max(pool, key=lambda a: a.get("id") or 0)


class CertificateError(Exception):
    """Exception class for certificate generation errors with message keys"""
    def __init__(self, message, message_key):
        self.message = message
        self.message_key = message_key
        super().__init__(message)


def is_degree_certificate(certificate_type, enrollments):
    """Tells whether this call generates degree certificates.

    A degree certificate is an achievement certificate for a Course inside a
    Program of type DEGREES (ProgramType values are exactly COURSES / EVENTS /
    DEGREES). The editable free-text ``Program.shortTitle`` is deliberately not
    used as the discriminator. All enrollments of one call belong to the same
    course, so the first row is authoritative.
    """
    if certificate_type != "achievement" or not enrollments:
        return False
    program = (enrollments[0].get("Course") or {}).get("Program") or {}
    return program.get("type") == DEGREE_PROGRAM_TYPE


def format_ects(value):
    """Formats an ECTS value for display: '12,5' / '12.5' / 12.5 -> '12.5'.

    ``Course.ects`` is a free-text column whose default is the literal 'NONE', so
    anything unparsable becomes '0'.
    """
    parsed = safe_float_convert(value)
    return f"{parsed:.1f}" if parsed is not None else "0"


def summarize_degree_participations(participations):
    """Builds the certificate lines and the requirement totals for one user.

    Args:
        participations (list): Rows as returned by
            ``EduHubClient.fetch_degree_participations`` for a single user.

    Line formats (unchanged from the implementation before the degree branch was
    dropped):
        passed course : "<course title> (<program title>) (<x.x> ECTS)"
        event         : "<course title> (Hackathon)"
    Events are listed after all passed courses.

    The totals mirror public.DegreeParticipationStats: ECTS are summed for every
    member enrollment carrying an achievement certificate (regardless of the
    member course's program type), and every EVENTS-program member enrollment
    counts as one event whether or not it has a certificate. Enrollment status is
    deliberately not filtered, because the view does not filter it either.

    Returns:
        dict: {"passed", "events", "entries", "ects_total", "event_count"}
    """
    passed = []
    events = []
    ects_total = 0.0
    event_count = 0

    for row in participations or []:
        title = row.get("title") or ""
        if row.get("hasAchievementCertificate"):
            ects_total += safe_float_convert(row.get("ects")) or 0.0
        if row.get("programType") == EVENTS_PROGRAM_TYPE:
            events.append(f"{title} (Hackathon)")
            event_count += 1
        elif row.get("hasAchievementCertificate"):
            # Only a passed course may be listed as a completed degree component.
            program_title = row.get("programTitle") or ""
            passed.append(
                f"{title} ({program_title}) ({format_ects(row.get('ects'))} ECTS)"
            )

    return {
        "passed": passed,
        "events": events,
        "entries": passed + events,
        "ects_total": ects_total,
        "event_count": event_count,
    }


def degree_thresholds(course):
    """Reads the configured degree thresholds off a Course row.

    Both values go through ``safe_float_convert`` because Hasura may serialize a
    ``numeric`` column as a JSON string, and comparing a number against a string
    is a TypeError in python 3.

    Returns:
        tuple: (required_ects, required_event_count), each a float or None.
               None means the requirement is not checked.
    """
    return (
        safe_float_convert(course.get("requiredEcts")),
        safe_float_convert(course.get("requiredEventCount")),
    )


def degree_requirement_shortfall(ects_total, event_count, required_ects, required_event_count):
    """Describes which configured degree requirements are not met yet.

    Returns:
        str or None: A human-readable shortfall (e.g. "10.0 of 12.5 ECTS,
                     0 of 1 events"), or None when every configured threshold is
                     met. A threshold of None is not checked at all.
    """
    parts = []
    if required_ects is not None and ects_total + ECTS_EPSILON < required_ects:
        parts.append(f"{ects_total:.1f} of {required_ects:.1f} ECTS")
    if required_event_count is not None and event_count < required_event_count:
        parts.append(f"{event_count:.0f} of {required_event_count:.0f} events")
    return ", ".join(parts) or None


def assert_degree_requirements(enrollments, degree_participations):
    """Pre-flight requirement gate for a bulk degree certificate run.

    Raises before any PDF is produced if a selected participant misses a
    configured threshold, so the operation is all-or-nothing (writing certificate
    URLs is not transactional across batches).

    Raises:
        CertificateError: message key DEGREE_REQUIREMENTS_NOT_MET.
    """
    failures = []
    for enrollment in enrollments:
        course = enrollment.get("Course") or {}
        user = enrollment.get("User") or {}
        required_ects, required_event_count = degree_thresholds(course)
        if required_ects is None and required_event_count is None:
            continue  # nothing configured for this degree -> nothing to check
        summary = summarize_degree_participations(
            degree_participations.get(user.get("id")) or []
        )
        shortfall = degree_requirement_shortfall(
            summary["ects_total"],
            summary["event_count"],
            required_ects,
            required_event_count,
        )
        if shortfall:
            name = f"{user.get('firstName') or ''} {user.get('lastName') or ''}".strip()
            failures.append(f"{name or user.get('id')} ({shortfall})")

    if failures:
        shown = "; ".join(failures[:5])
        more = f" and {len(failures) - 5} more" if len(failures) > 5 else ""
        raise CertificateError(
            f"Degree requirements not met for {len(failures)} selected "
            f"participant(s): {shown}{more}",
            "DEGREE_REQUIREMENTS_NOT_MET",
        )


class CertificateCreator:
    """
    The `CertificateCreator` class generates certificates for course enrollments by retrieving the necessary template images and html-texts, preparing the content for each certificate based on the enrollment data and then converting HTML templates into PDF certificates. These PDFs are then uploaded to Google Cloud Storage (GCS) and the URLs of the created certificates are updated in the course enrollment records. The class handles attendance and achievement certificates.

    A degree certificate is an achievement certificate for a course in a Program of
    type DEGREES. It resolves its HTML through the normal achievement chain (each
    degree course carries its own template via Course.achievementCertificateTemplateId),
    but it renders a different context: instead of learning goals and a practical
    project it lists the degree's completed components (`successful_participations`)
    and is gated on the thresholds configured in Course.requiredEcts /
    Course.requiredEventCount.
    """
    def __init__(self, arguments, enrollments=None, edu_hub_client=None, degree_participations=None):
        """
        Initializes the CertificateCreator with necessary arguments.

        Args:
            arguments (dict): A dictionary containing input data for certificate creation.
                              It must have keys 'input', 'certificateType', 'userIds', and 'courseId'.
            enrollments (list, optional): Pre-fetched enrollments list to reuse across batches.
            degree_participations (dict, optional): Degree participations per userId as
                              returned by EduHubClient.fetch_degree_participations. Only
                              used for degree certificates.
        """
        self.storage_client = StorageClient()
        self.eduhub_client = edu_hub_client or EduHubClient()
        self.certificate_type = arguments["input"]["certificateType"]
        self.user_ids = arguments["input"]["userIds"]
        self.course_id = arguments["input"]["courseId"] 
        self.image_cache = None
        self.image_url_cache = None
        
        if self.certificate_type not in ["achievement", "attendance"]:
            logging.error("Certificate type is incorrect or missing!")
            raise CertificateError("Invalid certificate type", "INVALID_CERTIFICATE_TYPE")

        # Use pre-fetched enrollments if provided, otherwise fetch them
        self.enrollments = enrollments
        if not self.enrollments:
            raise CertificateError("No enrollments found", "NO_ENROLLMENTS_FOUND")

        self.degree_participations = degree_participations or {}
        self.is_degree = is_degree_certificate(self.certificate_type, self.enrollments)

        logging.info(f"Processing {len(self.enrollments)} enrollments for certificate creation")
        if self.is_degree:
            logging.info("Detected degree certificate (Program.type = DEGREES)")

    def create_certificates(self,):
        """
        Creates certificates for all enrollments and updates the course enrollment records.
        
        Returns:
            int: Count of successfully generated certificates
                        
        Raises:
            CertificateError: If there's an error in the certificate creation process
        """
        # Use cached templates if provided, otherwise fetch them
        
        successful_count = 0

        for i, enrollment in enumerate(self.enrollments, 1):
            try:
                template_image_url = self.fetch_template_image()
                template_text = self.fetch_template_text(enrollment)
                pdf_url = self.generate_and_save_certificate_to_gcs(template_image_url, template_text, enrollment)
                self.eduhub_client.update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url, self.certificate_type)
                successful_count += 1
            except CertificateError as e:
                # Propagate certificate generation errors immediately
                logging.error(f"Certificate error: {str(e)}")
                raise
            except Exception as e:
                logging.error(f"Error in processing enrollment {i}: {e}")
                # Convert unexpected exceptions to CertificateError
                raise CertificateError(f"Error in processing enrollment {i}: {str(e)}", "CERTIFICATE_GENERATION_ERROR")
        
        logging.info(f"{successful_count}/{len(self.enrollments)} {self.certificate_type} certificate(s) successfully generated.")
        
        return successful_count

    def generate_and_save_certificate_to_gcs(self, template_image_url, template_text, enrollment):
        """
        Generates a certificate and saves it to Google Cloud Storage (GCS).

        Args:
            template_image_url (str): The URL of the template image.
            template_text (str): The HTML template text for the certificate.
            enrollment (dict): The enrollment data for the user.

        Returns:
            str: The file name of the generated PDF certificate
        
        Raises:
            CertificateError: If PDF creation fails, template image file is not found, or other errors occur
        """
        try:
            # Vorbereitung des Textinhalts
            logging.debug(f"Downloading template image from: {template_image_url}")
            if not self.image_url_cache or not self.image_cache:
                image = self.storage_client.download_image_from_gcs(template_image_url)
                self.image_cache = image
                self.image_url_cache = template_image_url
            elif self.image_url_cache != template_image_url:
                image = self.storage_client.download_image_from_gcs(template_image_url)
                self.image_cache = image
                self.image_url_cache = template_image_url
            else:
                image = self.image_cache
            text_content = self.prepare_text_content(enrollment, image)

            # Erstellen der Jinja2-Umgebung und Rendern von HTML
            env = Environment(loader=DictLoader({'template': template_text}))
            template = env.get_template('template')
            rendered_html = template.render(text_content)

            # Konvertierung von HTML zu PDF mit XHTML2PDF
            pdf_bytes_io = BytesIO()
            pisa_status = pisa.CreatePDF(rendered_html, dest=pdf_bytes_io)

            if not pisa_status.err:
                pdf_bytes_io.seek(0)
                pdf_file_name = self.generate_pdf_file_name(enrollment)
                url = self.storage_client.upload_file(
                    path="", 
                    blob_name=pdf_file_name, 
                    buffer=pdf_bytes_io, 
                    content_type='application/pdf'
                )
                pdf_bytes_io.close()


                logging.info(f'PDF available at: {url}')
                return pdf_file_name
            else:
                raise CertificateError("Failed to create PDF with XHTML2PDF", "PDF_CREATION_FAILED")

        except CertificateError:
            # Re-raise CertificateError directly
            raise
        except FileNotFoundError as e:
            # Convert FileNotFoundError to CertificateError
            raise CertificateError(f"Template file not found: {str(e)}", "CERTIFICATE_TEMPLATE_NOT_FOUND")
        except Exception as e:
            # Convert all other exceptions to CertificateError
            raise CertificateError(f"Error in certificate generation process: {str(e)}", "CERTIFICATE_GENERATION_ERROR")

    def fetch_template_image(self):
        """
        Fetches the template image URL based on the certificate type.

        Returns:
            str: The URL of the template image.

        Raises:
            CertificateError: If template URL is missing or certificate type is invalid
        """
        try:
            program = self.enrollments[0]['Course']['Program']
            logging.info(f"Program: {program}")
            
            if self.certificate_type == "achievement":
                if not program.get('achievementCertificateTemplateURL'):
                    raise CertificateError("Achievement certificate template URL not found", 
                                          "ACHIEVEMENT_TEMPLATE_URL_NOT_FOUND")
                logging.debug(f"Achievement certificate template URL: {program['achievementCertificateTemplateURL']}")
                return program['achievementCertificateTemplateURL']
            
            elif self.certificate_type == "attendance":
                if not program.get('attendanceCertificateTemplateURL'):
                    raise CertificateError("Attendance certificate template URL not found", 
                                          "ATTENDANCE_TEMPLATE_URL_NOT_FOUND")
                logging.debug(f"Attendance certificate template URL: {program['attendanceCertificateTemplateURL']}")
                return program['attendanceCertificateTemplateURL']
            
            else:
                raise CertificateError(f"Invalid certificate type: {self.certificate_type}", 
                                      "INVALID_CERTIFICATE_TYPE")
            
        except CertificateError:
            # Re-raise CertificateError directly
            raise
        except Exception as e:
            error_msg = f"Unexpected error fetching template image: {str(e)}"
            logging.error(error_msg)
            raise CertificateError(error_msg, "TEMPLATE_FETCH_ERROR")

    def fetch_template_text(self, enrollment):
        """
        Resolves the HTML certificate template via the scope chain populated by
        migration 1780045613786_migrate_achievements_to_projects:

          achievement : Course.AchievementCertificateTemplate
                    ?? Project.ProjectType.CertificateTemplate
          attendance  : Course.AttendanceCertificateTemplate
                    ?? Program.AttendanceCertificateTemplate

        A degree is just an achievement whose course owns its own
        Course.AchievementCertificateTemplate, so it resolves through the first
        step of the achievement chain with no special-casing.

        All candidate rows are fetched in the bulk enrollment query so this
        method makes no additional network call.

        Raises:
            CertificateError: If no template can be resolved.
        """
        try:
            course = enrollment.get("Course", {}) or {}
            program = course.get("Program", {}) or {}

            if self.certificate_type == "achievement":
                # Per-course override always wins (this is also where each degree
                # course's unique HTML lives).
                course_template = course.get("AchievementCertificateTemplate")
                if course_template and course_template.get("html"):
                    return course_template["html"]

                project_authors = enrollment.get("User", {}).get("ProjectAuthors") or []
                if not project_authors:
                    raise CertificateError(
                        "No completed project found for user", "ACHIEVEMENT_RECORD_NOT_FOUND"
                    )
                project_type = project_authors[0]["Project"].get("ProjectType") or {}
                type_template = project_type.get("CertificateTemplate") or {}
                html = type_template.get("html")
                if not html:
                    raise CertificateError(
                        f"No certificateTemplate found for projectType {project_authors[0]['Project'].get('type')}",
                        "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND",
                    )
                return html

            # Attendance: course override falls back to program default.
            course_template = course.get("AttendanceCertificateTemplate")
            if course_template and course_template.get("html"):
                return course_template["html"]
            program_template = program.get("AttendanceCertificateTemplate") or {}
            html = program_template.get("html")
            if not html:
                raise CertificateError(
                    f"No attendance certificateTemplate configured for program id={program.get('id')}",
                    "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND",
                )
            return html

        except CertificateError:
            raise
        except Exception as e:
            error_msg = f"Unexpected error fetching template text: {str(e)}"
            logging.error(error_msg)
            raise CertificateError(error_msg, "TEMPLATE_TEXT_FETCH_ERROR")

    def prepare_text_content(self, enrollment, image):
        """
        Prepares the text content for the certificate template.

        Args:
            enrollment (dict): The enrollment data for the user
            image (str): The template image

        Returns:
            dict: The prepared text content for the certificate

        Raises:
            CertificateError: If required enrollment data is missing or certificate type is invalid
        """
        try:
            if self.certificate_type == "attendance":
                if not enrollment.get('User') or not enrollment.get('Course'):
                    raise CertificateError("Missing required enrollment data", "MISSING_ENROLLMENT_DATA")
                
                session_titles = self.get_attended_sessions(enrollment, enrollment["Course"]["Sessions"])
                return {
                    "full_name": f"{enrollment['User']['firstName'].upper()} {enrollment['User']['lastName'].upper()}",
                    "course_name": enrollment["Course"]["title"],
                    "semester": enrollment["Course"]["Program"]["title"],
                    "event_entries": session_titles,
                    "template": image,
                    "ECTS": enrollment["Course"]["ects"]
                }
            
            elif self.certificate_type == "achievement":
                if self.is_degree:
                    if not enrollment.get('User') or not enrollment.get('Course'):
                        raise CertificateError("Missing required enrollment data", "MISSING_ENROLLMENT_DATA")

                    user = enrollment["User"]
                    course = enrollment["Course"]
                    summary = summarize_degree_participations(
                        self.degree_participations.get(user["id"]) or []
                    )
                    required_ects, required_event_count = degree_thresholds(course)

                    # create_certificates() already gate-checked every selected user;
                    # re-checking here makes it impossible to render a degree PDF
                    # whose claim the data does not support.
                    shortfall = degree_requirement_shortfall(
                        summary["ects_total"],
                        summary["event_count"],
                        required_ects,
                        required_event_count,
                    )
                    if shortfall:
                        raise CertificateError(
                            f"Degree requirements not met for {user['firstName']} "
                            f"{user['lastName']} ({shortfall})",
                            "DEGREE_REQUIREMENTS_NOT_MET",
                        )

                    # A degree does not award ECTS of its own, it requires them, so
                    # Course.ects is not used here at all. Both variables render the
                    # requirement and stay empty while none is configured, which makes an
                    # unconfigured degree visible on the certificate instead of silently
                    # printing a stale or wrong number.
                    required_ects_display = (
                        format_ects(required_ects) if required_ects is not None else ""
                    )

                    return {
                        "full_name": f"{user['firstName'].upper()} {user['lastName'].upper()}",
                        "course_name": course["title"],
                        "semester": course["Program"]["title"],
                        "program_title": course["Program"]["title"],
                        "template": image,
                        # Legacy variable name, kept so existing degree templates render.
                        "ECTS": required_ects_display,
                        "successful_participations": summary["entries"],
                        "passed_participations": summary["passed"],
                        "event_participations": summary["events"],
                        # Let a degree template state its own requirements instead of
                        # hard-coding them in the HTML.
                        "required_ects": required_ects,
                        "required_ects_display": required_ects_display,
                        "required_event_count": (
                            int(required_event_count) if required_event_count is not None else None
                        ),
                        "achieved_ects": summary["ects_total"],
                        "achieved_ects_display": f"{summary['ects_total']:.1f}",
                        "attended_event_count": summary["event_count"],
                    }

                if not enrollment.get('Course') or not enrollment.get('Course', {}).get('learningGoals'):
                    raise CertificateError("Missing required course or learning goals data", "MISSING_COURSE_DATA")

                learning_goals = [goal.strip() for goal in enrollment["Course"]["learningGoals"].split("\n") if goal.strip()]
                # Handle both string and numeric ECTS values
                ects_value = enrollment["Course"]["ects"]
                if isinstance(ects_value, str):
                    ects_float = float(ects_value.replace(",", "."))
                else:
                    ects_float = float(ects_value)

                project_authors = enrollment["User"].get("ProjectAuthors") or []
                if not project_authors:
                    raise CertificateError("No completed project found for user", "ACHIEVEMENT_RECORD_NOT_FOUND")

                return {
                    "full_name": f"{enrollment['User']['firstName'].upper()} {enrollment['User']['lastName'].upper()}",
                    "course_name": enrollment["Course"]["title"],
                    "semester": enrollment["Course"]["Program"]["title"],
                    "template": image,
                    "ECTS": str(ects_float * 30),
                    "learningGoalsList": learning_goals,
                    "praxisprojekt": project_authors[0]["Project"]["title"]
                }
            
            else:
                raise CertificateError(f"Invalid certificate type: {self.certificate_type}", "INVALID_CERTIFICATE_TYPE")
            
        except CertificateError:
            # Re-raise CertificateError directly
            raise
        except KeyError as e:
            error_msg = f"Missing required data field: {str(e)}"
            logging.error(error_msg)
            raise CertificateError(error_msg, "MISSING_REQUIRED_DATA")
        except Exception as e:
            error_msg = f"Unexpected error preparing text content: {str(e)}"
            logging.error(error_msg)
            raise CertificateError(error_msg, "TEXT_CONTENT_PREPARATION_ERROR")

    def generate_pdf_file_name(self, enrollment):
        """
        Generates the file name for the PDF certificate.

        Args:
            enrollment (dict): The enrollment data for the user.

        Returns:
            str: The generated file name for the PDF certificate.

        This method constructs a file name based on the user ID, course ID, and certificate type.
        """
        return f"{enrollment['User']['id']}/{enrollment['Course']['id']}/{self.certificate_type}_certificate.pdf"

    
    
    def get_attended_sessions(self, enrollment, sessions):
        """
        Gets the titles of attended sessions for a given enrollment, MISSED Sessions are ignored.

        Args:
            enrollment (dict): The enrollment data for the user.
            sessions (list): The list of sessions for the course.

        Returns:
            list: The titles of the attended sessions.

        This method filters and sorts the sessions based on attendance records and returns the titles
        of the sessions that the user attended.
        """
        attended_sessions = []

        for session in sessions:
            # Get every attendance record for one session
            attendances_for_session = [
                attendance
                for attendance in enrollment.get("User", {}).get("Attendances", [])
                if attendance.get("Session", {}).get("id") == session.get("id")
            ]

            # INSTRUCTOR-sourced rows win over automated ones (ZOOM /
            # LIMESURVEY / NULL); within the chosen pool, highest id wins.
            last_attendance = pick_effective_attendance(attendances_for_session)

            if last_attendance is not None and last_attendance.get("status") == "ATTENDED":
                attended_sessions.append(
                    {
                        "sessionTitle": session.get("title"),
                        "date": session.get("startDateTime"),  # Optional, fals Date is needed
                        "status": last_attendance.get("status", "NO_INFO"),  # Optional, if state is needed
                    }
                )
        # Sorting the Sessions by start Date 
        # Attention: Date must have the correct format!
        attended_sessions.sort(key=lambda x: x.get("date"))

        # get the title of the attended Session 
        attended_session_titles = [
            session["sessionTitle"]
            for session in attended_sessions
            if session["sessionTitle"] is not None
        ]

        return attended_session_titles



def create_certificates(arguments):
    """Creates certificates for specified users in a course."""
    try:
        edu_hub_client = EduHubClient()
        # if list of userIds is empty return success with count 0
        if not arguments["input"]["userIds"]:
            return {
                "success": True,
                "count": 0,
                "certificateType": arguments["input"]["certificateType"],
                "messageKey": "NO_USERS_SELECTED"
            }
        
        # Process in batches to prevent memory issues
        batch_size = 5  # Adjust based on memory constraints
        user_ids = arguments["input"]["userIds"]
        total_count = 0
        
        enrollments = edu_hub_client.fetch_enrollments(user_ids, arguments["input"]["courseId"])

        # A degree certificate lists the degree's completed components, which live on
        # other courses. Fetching them once here (rather than per batch or per user)
        # keeps it at a single round trip and lets the requirement gate run before
        # anything is uploaded, so a bulk run is all-or-nothing.
        degree_participations = {}
        if is_degree_certificate(arguments["input"]["certificateType"], enrollments):
            degree_participations = edu_hub_client.fetch_degree_participations(
                user_ids, arguments["input"]["courseId"]
            )
            assert_degree_requirements(enrollments, degree_participations)

        for i in range(0, len(enrollments), batch_size):
            batch_enrollments = enrollments[i:i+batch_size if i+batch_size < len(enrollments) else len(enrollments)]

            certificate_creator = CertificateCreator(
                arguments, batch_enrollments, edu_hub_client, degree_participations
            )
            count = certificate_creator.create_certificates()
            total_count += count
            
            # Force garbage collection after each batch
            import gc
            gc.collect()
            
        logging.info(f"Successfully generated {total_count} certificates")
        return {
            "success": True,
            "count": total_count,
            "certificateType": arguments["input"]["certificateType"],
            "messageKey": "CERTIFICATES_GENERATED_SUCCESS"
        }
        
    except CertificateError as e:
        logging.error(f"Certificate error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": e.message_key
        }
    except Exception as e:
        # Catch any unexpected exceptions that weren't converted to CertificateError
        logging.error(f"Unexpected error creating certificates: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": "UNEXPECTED_ERROR"
        }
