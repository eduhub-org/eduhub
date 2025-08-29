from urllib.request import urlopen
import logging
import requests
from api_clients import EduHubClient, StorageClient
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa 


class CertificateError(Exception):
    """Exception class for certificate generation errors with message keys"""
    def __init__(self, message, message_key):
        self.message = message
        self.message_key = message_key
        super().__init__(message)

class CertificateCreator:
    """
    The `CertificateCreator` class generates certificates for course enrollments by retrieving the necessary template images and html-texts, preparing the content for each certificate based on the enrollment data and then converting HTML templates into PDF certificates. These PDFs are then uploaded to Google Cloud Storage (GCS) and the URLs of the created certificates are updated in the course enrollment records. The class handles both attendance and achievement certificates.
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

        logging.info(f"Processing {len(self.enrollments)} enrollments for certificate creation")


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
        Fetches the HTML template text for the certificate.

        Returns:
            str: The HTML template text.

        Raises:
            CertificateError: If template text cannot be fetched or is not found
        """
        try:
            program_id = self.enrollments[0]['Course']['Program']['id']
            
            logging.info(f"Certificate Type: {self.certificate_type}")
            # Only get record_type for achievement certificates
            if self.certificate_type == "achievement":
                if not self.enrollments[0].get('User', {}).get('AchievementRecordAuthors'):
                    raise CertificateError("No achievement record found for user", 
                                          "ACHIEVEMENT_RECORD_NOT_FOUND")
                record_type = enrollment['User']['AchievementRecordAuthors'][0]['AchievementRecord']['AchievementOption']['recordType']
            else:  # attendance certificate
                record_type = "DOCUMENTATION"  # or whatever the correct record type is for attendance
            
            logging.info(f"Fetching template for record type: {record_type}")

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
            variables = {"programId": program_id, "certificateType": self.certificate_type.upper(), "recordType": record_type}
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
                    raise CertificateError(f"GraphQL Error: {data['errors']}", 
                                          "GRAPHQL_ERROR")

                # check if the template is empty or more than one template is found
                if not data['data']['CertificateTemplateProgram'] or len(data['data']['CertificateTemplateProgram']) > 1:
                    raise CertificateError(
                        f"No matching template found for recordType: {record_type} and certificateType: {self.certificate_type.upper()}", 
                        "CERTIFICATE_TEMPLATE_TEXT_NOT_FOUND"
                    )
                
                # Get the first template from the list of templates
                return data['data']['CertificateTemplateProgram'][0]['CertificateTemplateText']['html']

            except requests.exceptions.RequestException as e:
                raise CertificateError(f"GraphQL request failed: {str(e)}", 
                                      "API_REQUEST_FAILED")

        except CertificateError:
            # Re-raise CertificateError directly
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
                    "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                    "course_name": enrollment["Course"]["title"],
                    "semester": enrollment["Course"]["Program"]["title"],
                    "event_entries": session_titles,
                    "template": image,
                    "ECTS": enrollment["Course"]["ects"]
                }
            
            elif self.certificate_type == "achievement":
                if not enrollment.get('Course') or not enrollment.get('Course', {}).get('learningGoals'):
                    raise CertificateError("Missing required course or learning goals data", "MISSING_COURSE_DATA")
                
                learning_goals = [goal.strip() for goal in enrollment["Course"]["learningGoals"].split("\n") if goal.strip()]
                return {
                    "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                    "course_name": enrollment["Course"]["title"],
                    "semester": enrollment["Course"]["Program"]["title"],
                    "template": image,
                    "ECTS": str(float(enrollment["Course"]["ects"].replace(",", ".")) * 30),
                    "learningGoalsList": learning_goals,
                    "praxisprojekt": enrollment["User"]["AchievementRecordAuthors"][0]["AchievementRecord"]["AchievementOption"]["title"]
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

            # Choosing the newest attendance record by highest ID
            if attendances_for_session:
                attendances_for_session.sort(key=lambda x: x.get("id"), reverse=True)
                last_attendance = attendances_for_session[0]

                # Add attendance if Status attended
                if last_attendance.get("status") == "ATTENDED":
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
