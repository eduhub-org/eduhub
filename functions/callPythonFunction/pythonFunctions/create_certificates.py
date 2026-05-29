from urllib.request import urlopen
import logging
import requests
from api_clients import EduHubClient, StorageClient
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa 


ATTENDANCE_SOURCE_INSTRUCTOR = "INSTRUCTOR"


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

class CertificateCreator:
    """
    The `CertificateCreator` class generates certificates for course enrollments by retrieving the necessary template images and html-texts, preparing the content for each certificate based on the enrollment data and then converting HTML templates into PDF certificates. These PDFs are then uploaded to Google Cloud Storage (GCS) and the URLs of the created certificates are updated in the course enrollment records. The class handles attendance certificates, achievement certificates, and degree certificates (which are a special type of achievement certificate for Programs with shortTitle "DEGREES").
    """
    def __init__(self, arguments, enrollments=None, edu_hub_client=None):
        """
        Initializes the CertificateCreator with necessary arguments.

        Args:
            arguments (dict): A dictionary containing input data for certificate creation. 
                              It must have keys 'input', 'certificateType', 'userIds', and 'courseId'.
            enrollments (list, optional): Pre-fetched enrollments list to reuse across batches.
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

        # Check if this is a degree certificate (Program shortTitle "DEGREES")
        self.is_degree = self._is_degree_certificate()
        
        logging.info(f"Processing {len(self.enrollments)} enrollments for certificate creation")
        if self.is_degree:
            logging.info("Detected degree certificate (Program shortTitle: DEGREES)")

    def _is_degree_certificate(self):
        """
        Checks if this is a degree certificate by verifying if the program shortTitle is "DEGREES".
        
        Returns:
            bool: True if this is a degree certificate (Program shortTitle "DEGREES"), False otherwise
        """
        try:
            if self.enrollments and len(self.enrollments) > 0:
                program_short_title = self.enrollments[0].get('Course', {}).get('Program', {}).get('shortTitle')
                return program_short_title == "DEGREES"
            return False
        except Exception as e:
            logging.warning(f"Could not determine if this is a degree certificate: {e}")
            return False

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

    # Project type used as the certificate-template fallback when a non-degree
    # achievement certificate's resolved ProjectType has no certificateTemplateHtml.
    DEFAULT_ACHIEVEMENT_PROJECT_TYPE = "CLASSIC_PROJECT"
    # Title under which the degree certificate template HTML is seeded into
    # CertificateTemplateText, used as a final fallback for degree certificates
    # when no per-program CertificateTemplateProgram row resolves.
    DEGREE_TEMPLATE_TITLE = "degree certificate example"

    def fetch_template_text(self, enrollment):
        """
        Fetches the HTML template text for the certificate.

        - Achievement (non-degree): ProjectType.certificateTemplateHtml resolved
          via the user's completed Project (falls back to the CLASSIC_PROJECT
          template).
        - Achievement (degree): legacy CertificateTemplateProgram -> CertificateTemplateText
          lookup keyed by program + recordType=DOCUMENTATION (degree certificates
          have no underlying project), with a final fallback to the seeded
          'degree certificate example' CertificateTemplateText row.
        - Attendance: legacy CertificateTemplateProgram -> CertificateTemplateText
          lookup; attendance certificates are unrelated to projects.

        Raises:
            CertificateError: If template text cannot be fetched or is not found.
        """
        try:
            if self.certificate_type == "achievement" and not self.is_degree:
                project_authors = enrollment.get('User', {}).get('ProjectAuthors') or []
                if not project_authors:
                    raise CertificateError("No completed project found for user",
                                          "ACHIEVEMENT_RECORD_NOT_FOUND")
                project_type = project_authors[0]['Project'].get('type') \
                    or self.DEFAULT_ACHIEVEMENT_PROJECT_TYPE
                return self.fetch_project_type_template_html(project_type)

            # Degree or attendance: legacy per-program HTML lookup.
            return self._fetch_legacy_program_template_html(
                fallback_title=self.DEGREE_TEMPLATE_TITLE if self.is_degree else None
            )

        except CertificateError:
            # Re-raise CertificateError directly
            raise
        except Exception as e:
            error_msg = f"Unexpected error fetching template text: {str(e)}"
            logging.error(error_msg)
            raise CertificateError(error_msg, "TEMPLATE_TEXT_FETCH_ERROR")

    def _fetch_legacy_program_template_html(self, fallback_title=None):
        """
        Legacy lookup: CertificateTemplateProgram -> CertificateTemplateText keyed by
        the enrollment's programId, the current certificate_type, and recordType=DOCUMENTATION.
        When fallback_title is provided and the join returns nothing, the function falls back
        to the CertificateTemplateText row with that title (used to ship a working degree
        template in environments without an explicit CertificateTemplateProgram link).
        """
        program_id = self.enrollments[0]['Course']['Program']['id']
        record_type = "DOCUMENTATION"
        logging.info(
            f"Fetching legacy {self.certificate_type} template for program {program_id}"
        )
        query = """
        query getTemplateHtml($programId: Int!, $certificateType: CertificateType_enum!, $recordType: AchievementRecordType_enum!) {
            CertificateTemplateProgram(where: {programId: {_eq: $programId}, CertificateTemplateText: {certificateType: {_eq: $certificateType}, recordType: {_eq: $recordType}}}) {
                CertificateTemplateText {
                    html
                    recordType
                    certificateType
                }
            }
        }
        """
        variables = {
            "programId": program_id,
            "certificateType": self.certificate_type.upper(),
            "recordType": record_type,
        }
        headers = {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret,
        }
        try:
            response = requests.post(
                self.eduhub_client.url,
                json={"query": query, "variables": variables},
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            if "errors" in data:
                raise CertificateError(f"GraphQL Error: {data['errors']}", "GRAPHQL_ERROR")

            rows = data["data"]["CertificateTemplateProgram"]
            if len(rows) == 1:
                return rows[0]["CertificateTemplateText"]["html"]
            if len(rows) > 1:
                raise CertificateError(
                    f"Multiple matching templates found for recordType: {record_type} and certificateType: {self.certificate_type.upper()}",
                    "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND",
                )
            # rows is empty - try the title-based fallback if one was requested.
            if fallback_title:
                fallback_html = self._fetch_template_html_by_title(fallback_title)
                if fallback_html:
                    logging.info(
                        f"Using fallback CertificateTemplateText '{fallback_title}'"
                    )
                    return fallback_html
            raise CertificateError(
                f"No matching template found for recordType: {record_type} and certificateType: {self.certificate_type.upper()}",
                "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND",
            )
        except requests.exceptions.RequestException as e:
            raise CertificateError(f"GraphQL request failed: {str(e)}", "API_REQUEST_FAILED")

    def _fetch_template_html_by_title(self, title):
        """Fetches a CertificateTemplateText.html row by its unique title; returns None when absent."""
        query = """
        query getTemplateHtmlByTitle($title: String!) {
            CertificateTemplateText(where: {title: {_eq: $title}}) { html }
        }
        """
        headers = {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret,
        }
        response = requests.post(
            self.eduhub_client.url,
            json={"query": query, "variables": {"title": title}},
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()
        rows = data.get("data", {}).get("CertificateTemplateText") or []
        return rows[0]["html"] if rows else None

    def fetch_project_type_template_html(self, project_type):
        """
        Fetches ProjectType.certificateTemplateHtml for the given project type, falling
        back to the CLASSIC_PROJECT template when the type has no own template.

        Raises:
            CertificateError: If the request fails or no template can be resolved.
        """
        query = """
        query getProjectTypeTemplate($value: String!, $fallback: String!) {
            ProjectType(where: {value: {_in: [$value, $fallback]}}) {
                value
                certificateTemplateHtml
            }
        }
        """
        variables = {"value": project_type, "fallback": self.DEFAULT_ACHIEVEMENT_PROJECT_TYPE}
        headers = {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret
        }
        try:
            response = requests.post(
                self.eduhub_client.url,
                json={'query': query, 'variables': variables},
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            if 'errors' in data:
                raise CertificateError(f"GraphQL Error: {data['errors']}", "GRAPHQL_ERROR")

            rows = {row['value']: row.get('certificateTemplateHtml') for row in data['data']['ProjectType']}
            html = rows.get(project_type) or rows.get(self.DEFAULT_ACHIEVEMENT_PROJECT_TYPE)
            if not html:
                raise CertificateError(
                    f"No certificateTemplateHtml found for project type {project_type} (or fallback {self.DEFAULT_ACHIEVEMENT_PROJECT_TYPE})",
                    "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND"
                )
            logging.info(f"Using certificate template for project type: {project_type}")
            return html
        except requests.exceptions.RequestException as e:
            raise CertificateError(f"GraphQL request failed: {str(e)}", "API_REQUEST_FAILED")

    def get_successful_degree_participations(self, user_id, degree_course_id):
        """
        Fetches all successful course participations (with achievement certificate) 
        and attended events for a user within a specific degree program.

        Args:
            user_id (str): The UUID of the user
            degree_course_id (int): The ID of the degree course

        Returns:
            list: A list of formatted course participation strings
                  Format: "Kurstitel (Semester) (ECTS)" for courses or "Event-Titel (Hackathon)" for events
        """
        query = """
        query GetSuccessfulDegreeParticipations($userId: uuid!, $degreeCourseId: Int!) {
            User_by_pk(id: $userId) {
                CourseEnrollments(
                    where: {
                        Course: {
                            CourseDegrees: { degreeCourseId: { _eq: $degreeCourseId } }
                        },
                        _or: [
                            { achievementCertificateURL: { _is_null: false } },
                            {
                                Course: {
                                    Program: { shortTitle: { _eq: "EVENTS" } }
                                }
                            }
                        ]
                    }
                ) {
                    Course {
                        id
                        title
                        ects
                        Program {
                            title
                            shortTitle
                        }
                    }
                }
            }
        }
        """
        
        variables = {
            "userId": user_id,
            "degreeCourseId": degree_course_id
        }
        
        try:
            result = self.eduhub_client.send_query(query, variables)
            
            if result.get("errors"):
                logging.warning(f"GraphQL errors when fetching degree participations: {result['errors']}")
                return []
            
            user_data = result.get("data", {}).get("User_by_pk")
            if not user_data:
                return []
            
            enrollments = user_data.get("CourseEnrollments", [])
            formatted_participations = []
            events = []
            
            for enrollment in enrollments:
                course = enrollment.get("Course", {})
                course_title = course.get("title", "")
                program_title = course.get("Program", {}).get("title", "")
                program_short_title = course.get("Program", {}).get("shortTitle", "")
                ects = course.get("ects", "0")
                
                # Check if this is an Event
                if program_short_title == "EVENTS":
                    # Format: "Event-Titel (Hackathon)"
                    formatted_entry = f"{course_title} (Hackathon)"
                    events.append(formatted_entry)
                else:
                    # Format ECTS: replace comma with dot and handle formatting
                    try:
                        ects_float = float(ects.replace(",", "."))
                        ects_formatted = f"{ects_float:.1f}"
                    except (ValueError, AttributeError):
                        ects_formatted = "0"
                    
                    formatted_entry = f"{course_title} ({program_title}) ({ects_formatted} ECTS)"
                    formatted_participations.append(formatted_entry)
            
            # Events are added at the end
            formatted_participations.extend(events)
            
            return formatted_participations
            
        except Exception as e:
            logging.error(f"Error fetching successful degree participations: {e}")
            return []

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
                    # Degree certificate - fetch successful participations
                    user_id = enrollment["User"]["id"]
                    successful_participations = self.get_successful_degree_participations(user_id, self.course_id)
                    

                    return {
                        "full_name": f"{enrollment['User']['firstName'].upper()} {enrollment['User']['lastName'].upper()}",
                        "course_name": enrollment["Course"]["title"],
                        "semester": enrollment["Course"]["Program"]["title"],
                        "template": image,
                        "ECTS": enrollment["Course"]["ects"],
                        "program_title": enrollment["Course"]["Program"]["title"],
                        "successful_participations": successful_participations
                    }
                else:
                    # Regular achievement certificate
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

        for i in range(0, len(enrollments), batch_size):
            batch_enrollments = enrollments[i:i+batch_size if i+batch_size < len(enrollments) else len(enrollments)]
            
            certificate_creator = CertificateCreator(arguments, batch_enrollments, edu_hub_client)
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
