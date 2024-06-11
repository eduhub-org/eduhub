from urllib.request import urlopen
import logging
import os
import requests
from api_clients import EduHubClient, StorageClient
import io 
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa 

class CertificateCreator:
    """
    The `CertificateCreator` class generates certificates for course enrollments by retrieving the necessary template images and html-texts, preparing the content for each certificate based on the enrollment data and then converting HTML templates into PDF certificates. These PDFs are then uploaded to Google Cloud Storage (GCS) and the URLs of the created certificates are updated in the course enrollment records. The class handles both attendance and achievement certificates.
    """
    def __init__(self, arguments):
        """
        Initializes the CertificateCreator with necessary arguments.

        Args:
            arguments (dict): A dictionary containing input data for certificate creation. 
                              It must have keys 'input', 'certificateType', 'userIds', and 'courseId'.

        This constructor sets up the initial state by initializing the storage and EduHub clients,
        validating the certificate type, and fetching enrollments for the given user IDs and course ID.                                            
        """
        self.storage_client = StorageClient()
        self.eduhub_client = EduHubClient()
        self.certificate_type = arguments["input"]["certificateType"]
        self.user_ids = arguments["input"]["userIds"]
        self.course_id = arguments["input"]["courseId"] 

        if self.certificate_type not in ["achievement", "attendance"]:
            logging.error("Certificate type is incorrect or missing!")
            raise ValueError("Invalid certificate type")

        self.enrollments = self.eduhub_client.fetch_enrollments(self.user_ids, self.course_id)
        logging.info(f"Fetched enrollments for certificate creation: {self.enrollments}")

    def create_certificates(self):
        """
        Creates certificates for all enrollments and updates the course enrollment records.

        This method performs the following steps:
        1. Fetches the template image and text based on the certificate type and enrollments.
        2. Iterates through each enrollment and generates a certificate.
        3. Updates the course enrollment records with the generated certificate URLs.
        """
    
        template_image_url = self.fetch_template_image()
        template_text = self.fetch_template_text()
        successful_count = 0
    
        for i, enrollment in enumerate(self.enrollments, 1):
            try:
                pdf_url = self.generate_and_save_certificate_to_gcs(template_image_url, template_text, enrollment)
                self.eduhub_client.update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url, self.certificate_type)
                successful_count += 1
            except Exception as e:
                logging.error(f"Error in processing enrollment {i}: {e}")
    
        logging.info(f"{successful_count}/{len(self.enrollments)} {self.certificate_type} certificate(s) successfully   generated.")

    def generate_and_save_certificate_to_gcs(self, template_image_url, template_text, enrollment):
        """
       Generates a certificate and saves it to Google Cloud Storage (GCS).

        Args:
            template_image_url (str): The URL of the template image.
            template_text (str): The HTML template text for the certificate.
            enrollment (dict): The enrollment data for the user.

        This method performs the following steps:
        1. Downloads the template image from GCS.
        2. Prepares the text content for the certificate using enrollment data.
        3. Renders the HTML template with the prepared text content.
        4. Converts the rendered HTML to a PDF.
        5. Uploads the generated PDF to GCS and returns the URL.
        """
        # Vorbereitung des Textinhalts
        image = self.storage_client.download_file(template_image_url)
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
                path="", blob_name=pdf_file_name, buffer=pdf_bytes_io, content_type='application/pdf')
            logging.info(f'PDF available at: {url}')
            return url
        else:
            logging.error("Failed to create PDF with XHTML2PDF.")
            raise RuntimeError("PDF creation failed")


    def fetch_template_image(self):
        """
        Fetches the template image URL based on the certificate type.

        Returns:
            str: The URL of the template image.

        This method selects the appropriate template image URL based on whether the certificate type is 'achievement' or 'attendance'.
        """
        if self.certificate_type == "achievement":
            return self.enrollments[0]['Course']['Program']['achievementCertificateTemplateURL']
        elif self.certificate_type == "attendance":
            return self.enrollments[0]['Course']['Program']['attendanceCertificateTemplateURL']
        else:
            raise ValueError("Invalid Certificate type")

        
    def fetch_template_text(self):
        """
        Fetches the HTML template text for the certificate.

        Returns:
            str: The HTML template text.

        This method performs a GraphQL query to fetch the template text based on the program ID and certificate type.
        It searches for a matching template that corresponds to the record type and certificate type.
        """
        record_type = self.enrollments[0]['User']['AchievementRecordAuthors'][0]['AchievementRecord']['AchievementOption']['recordType']
        program_id = self.enrollments[0]['Course']['Program']['id']

        query = """
        query getTemplateHtml($programId: Int!) {
    CertificateTemplateProgram(where: {programId: {_eq: $programId}}) {
        CertificateTemplateText {
            html
            recordType
            certificateType 
        }
    }
}

        """
        variables = {
            "programId": program_id
        }

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
                logging.error(f"GraphQL Error: {data['errors']}")
                return None

            # Run through the templates and find the right template.
            templates = data['data']['CertificateTemplateProgram']
            certificate_type_in_caps = self.certificate_type.upper()
            for program in templates:
                template = program['CertificateTemplateText']
                if template['recordType'] == record_type and template['certificateType'] == certificate_type_in_caps:
                    return template['html']

            logging.error("No matching template found for the specified recordType and certificateType.")
            return None

        except requests.exceptions.RequestException as e:
            logging.error(f"An error occurred during the GraphQL request: {str(e)}")
            return None

    def prepare_text_content(self, enrollment, image):
        """
        Searches the respective values from the enrollment information for the variables to be filled in the HTML template. 

        Args:
            enrollment (dict): The enrollment data for the user.
            image (str): The template image.

        Returns:
            dict: The text content to be rendered in the certificate.

        This method prepares the content based on the certificate type. It includes user details,
        course details, and other relevant information that will be rendered in the certificate template.
        """
        if self.certificate_type == "attendance":
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
            learning_goals = [goal.strip() for goal in enrollment["Course"]["learningGoals"].split(". ") if goal.strip()]
            return {
                "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                "course_name": enrollment["Course"]["title"],
                "semester": enrollment["Course"]["Program"]["title"],
                "template": image,
                "ECTS": str(int(enrollment["Course"]["ects"]) * 30),
                "learningGoalsList": learning_goals,
                "praxisprojekt": enrollment["User"]["AchievementRecordAuthors"][0]["AchievementRecord"]["AchievementOption"]["title"]
            }
        else:
            raise ValueError("Invalid certificate type")

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



def create_certificates(hasura_secret, arguments):
    """
    Wrapper function to create certificates.

    Args:
        hasura_secret (str): The Hasura admin secret.
        arguments (dict): A dictionary containing input data for certificate creation.

    This function initializes the CertificateCreator with the given arguments and
    calls the create_certificates method to generate the certificates.
    """
    try:
        certificate_creator = CertificateCreator(arguments)
        certificate_creator.create_certificates()
        logging.info("Certificates creation process completed.")
    except Exception as e:
        logging.error("Error in creating certificates: %s", str(e))
