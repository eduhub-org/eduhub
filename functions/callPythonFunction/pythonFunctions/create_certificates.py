from jinja2 import Environment, FileSystemLoader
import logging
import jinja2
import os
import requests
from api_clients import EduHubClient, StorageClient
import io 
from xhtml2pdf import pisa

class CertificateCreator:
    """
    A class for creating certificates based on course enrollments.

    This class handles the generation of certificates for users based on their
    course enrollments and the type of certificate (e.g., achievement, attendance).

    Attributes:
        storage_client (StorageClient): An instance of StorageClient for handling storage operations.
        eduhub_client (EduHubClient): An instance of EduHubClient for interacting with the EduHub API.
        certificate_type (str): The type of certificate to be created (e.g., 'achievement', 'attendance').
        user_ids (list): A list of user IDs for whom the certificates are to be created.
        course_id (int): The ID of the course for which the certificates are to be created.
        enrollments (list): A list of enrollment data fetched based on provided user IDs and course ID.
    """

    def __init__(self, arguments):
        """
        Initializes the CertificateCreator with necessary arguments.

        Args:
            arguments (dict): A dictionary containing input data for certificate creation. 
                              It must have keys 'input', 'certificateType', 'userIds', and 'courseId'.
        """
        # Initialization code...
        self.storage_client = StorageClient()
        self.eduhub_client = EduHubClient()
        self.certificate_type = arguments["input"]["certificateType"]
        self.user_ids = arguments["input"]["userIds"]
        self.course_id = arguments["input"]["courseId"] 

        if self.certificate_type not in ["achievement", "attendance"]:
            logging.error("Certificate type is incorrect or missing!")
            raise ValueError("Invalid certificate type")

        self.enrollments = self.eduhub_client.fetch_enrollments(self.user_ids, self.course_id)
        logging.info("Fetched enrollments for certificate creation.")

    def create_certificates(self):
        """
        Creates certificates for all enrollments and updates the course enrollment records.
    
        This method iterates through each enrollment, generates a certificate, and updates
        the enrollment record with the certificate's URL. It handles both 'achievement'
        and 'attendance' types of certificates.
        """
    
        template_image_url = self.fetch_template_image()
        template_text = self.fetch_template_text()
        bucket = self.storage_client.get_bucket()
        successful_count = 0
    
        for i, enrollment in enumerate(self.enrollments, 1):
            try:
                pdf_url = self.generate_and_save_certificate_to_gcs(template_image_url, template_text, bucket)
                self.eduhub_client.update_course_enrollment_record(enrollment["id"], pdf_url)
                successful_count += 1
            except Exception as e:
                logging.error(f"Error in processing enrollment {i}: {e}")
    
        logging.info(f"{successful_count}/{len(self.enrollments)} {self.certificate_type} certificate(s) successfully   generated.")

    def generate_and_save_certificate_to_gcs(self, template_image_url, template_text, bucket_name):
        # Prepare Text Content
        text_content = self.prepare_text_content()

        # Generate PDF File Name
        pdf_file_name = self.generate_pdf_file_name()

        # Create Jinja2 Environment
        env = Environment(loader=jinja2.DictLoader({'template': template_text}))

        template = env.get_template('template')

        rendered_html = template.render(background_image_url=template_image_url, html_content=text_content)

        # create PDF as BytesIO Object
        pdf_bytes_io = io.BytesIO()
        
        # Convert HTML to PDF with xhtml2pdf
        pisa_status = pisa.CreatePDF(
            io.StringIO(rendered_html), 
            dest=pdf_bytes_io
        )

        # Check for errors
        if pisa_status.err:
            raise Exception("Error generating PDF")

        # Reset buffer position to the beginning
        pdf_bytes_io.seek(0)

        temporary_pdf = pdf_bytes_io

        ## Saving Certificate PDF
        #Instantiiating GCS Client
        storage_client = storage.Client()

    
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(pdf_file_name)

        blob.upload_from_file(temporary_pdf, content_type='application/pdf')

        return blob.public_url

    def fetch_program_info(self):
        #TODO: get textID and Image URL per userID via program 
        pass

    def fetch_template_image(self):
        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            if self.certificate_type == "achievement":
                image_url = self.enrollments[0]['Course']['Program']['achievementCertificateTemplateURL']
            else: 
                image_url = self.enrollments[0]['Course']['Program']['attendanceCertificateTemplateURL']
            return image_url
        elif self.certificate_type == "instructor":
            #There is no URL yet
            pass            
        else: 
            raise ValueError("Invalid Certificate type")
        
    def fetch_template_text(self):
         # Necessary Data to retrieve HTML from hasura 
        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            if self.certificate_type == "achievement":
                text_id =self.enrollments[0]['Course']['Program']['achievementCertificateTemplateTextId']
            else:
                text_id = self.enrollments[0]['Course']['Program']['attendanceCertifiateTemplateTextId']
            return text_id
        elif self.certificate_type == "instructor":
            #There is no ID yet
            pass       
        else: 
            print("Certificate type is incorrect or missing!")

        # GraphQL query
        query = """
        query getHTML {
            CertificateTemplateText(where: {id: {_eq: "textId"}}) {
                html
        }
        """
        variables = {
                "textId": text_id
            }

        # Headers including the admin secret
        headers = {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret
        }

        # Make the request to the GraphQL endpoint
        try:
            response = requests.post(
            self.eduhub_client.hasura_endpoint,
            json={'query': query, 'variables': variables},
            headers=headers
        )
            response.raise_for_status()  # Raises a HTTPError if the HTTP request returned an unsuccessful status code

            # Assuming the data is returned in JSON format
            data = response.json()
            return data['data']['html']
        except requests.exceptions.RequestException as e:
        # Handle any errors that occur during the request
            logging.info("An error occured")

    def prepare_text_content(self):
        if self.certificate_type == "attendance" or self.certificate_type == "achievement":
            if self.certificate_type == "attendance":
                session_titles = self.get_attended_sessions(
                    self.enrollment, self.enrollment["Course"]["Sessions"]
                )
            else:
                session_titles = None 
            return {
            "full_name": f"{self.enrollment['User']['firstName']} {self.enrollment['User']['lastName']}",
            "course_name": self.enrollment["Course"]["title"],
            "semester":self.enrollment["Course"]["Program"]["title"],
            "event_entries": session_titles,
            }

        elif self.certificate_type == "instructor":
        
            return {
            "full_name": None,
            "course_name": None,
            "semester": None, 
            "event_entries": None
            }
        else:
            raise ValueError("Invalid certificate type")

    def generate_pdf_file_name(self):
        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            return f"{self.enrollment['User']['id']}/{self.enrollment['Course']['id']}/{self.certificate_type}_certificate.pdf"
        else: 
            return f"{self.program_info['User']['id']}/{self.program_info['Course']['id']}/{self.certificate_type}_certificate.pdf"
    
    def download_template_image(self, template_image_url):
        response = requests.get(template_image_url)
        response.raise_for_status()  # Makes sure request was succesfull
        return response.text
    
    def get_attended_sessions(enrollment, sessions):
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
                            # "date": session.get("startDateTime"),  # Optional, fals Date is needed
                            # "status": last_attendance.get("status", "NO_INFO"),  # Optional, if state is needed
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
    try:
        certificate_creator = CertificateCreator(arguments)
        certificate_creator.create_certificates()
        logging.info("Certificates creation process completed.")
    except Exception as e:
        logging.error("Error in creating certificates: %s", str(e))

