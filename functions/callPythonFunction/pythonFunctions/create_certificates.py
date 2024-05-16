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
        logging.info(f"Fetched enrollments for certificate creation: {self.enrollments}")

    def create_certificates(self):
        """
        Creates certificates for all enrollments and updates the course enrollment records.
    
        This method iterates through each enrollment, generates a certificate, and updates
        the enrollment record with the certificate's URL. It handles both 'achievement'
        and 'attendance' types of certificates.
        """
    
        template_image_url = self.fetch_template_image()
        template_text = self.fetch_template_text()
        successful_count = 0
        
        logging.info("############################################################")
        logging.info(f"Enrollments:{self.enrollments}")
        logging.info(f"The template image url is {template_image_url}")
        logging.info(f"The template text  is {template_text}")
    
    
        for i, enrollment in enumerate(self.enrollments, 1):
            try:
                pdf_url = self.generate_and_save_certificate_to_gcs(template_image_url, template_text, enrollment)
                
                logging.info(f"The pdf_url is: {pdf_url}")

                self.eduhub_client.update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url, self.certificate_type)
                successful_count += 1
            except Exception as e:
                logging.error(f"Error in processing enrollment {i}: {e}")
    
        logging.info(f"{successful_count}/{len(self.enrollments)} {self.certificate_type} certificate(s) successfully   generated.")

    def generate_and_save_certificate_to_gcs(self, template_image_url, template_text, enrollment):
        # Vorbereitung des Textinhalts
        image = self.storage_client.download_file(template_image_url)
        text_content = self.prepare_text_content(enrollment, image)
        logging.info(f"Der TextContent ist: {text_content}")
        logging.info(f"Das html_template ist: {template}")

        # Erstellen der Jinja2-Umgebung und Rendern von HTML
        env = Environment(loader=DictLoader({'template': template_text}))
        template = env.get_template('template')
        
        rendered_html = template.render(text_content)
        logging.info(f"Der gerenderte html: {rendered_html}")

        # Konvertierung von HTML zu PDF mit XHTML2PDF
        pdf_bytes_io = BytesIO()
        pisa_status = pisa.CreatePDF(rendered_html, dest=pdf_bytes_io)

        if not pisa_status.err:
            pdf_bytes_io.seek(0)
            pdf_file_name = self.generate_pdf_file_name(enrollment)
            url = self.storage_client.upload_file(
                path="", blob_name=pdf_file_name, buffer=pdf_bytes_io, content_type='application/pdf')
            logging.info(f'Das PDF ist hier verfügbar: {url}')
        else:
            logging.error("Fehler bei der PDF-Erstellung mit XHTML2PDF.")

        return url

   

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
        logging.info("fetch_template_text gets called")
        logging.info(f"The enrollments are: {self.enrollments}")

        record_type = self.enrollments[0]['User']['AchievementRecordAuthors'][0]['AchievementRecord']['AchievementOption']['recordType']
        record_type = record_type if record_type is not None else "NULL"
        certificate_type = self.certificate_type 
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
            logging.info(f"The DATA is: {data}")

            if 'errors' in data:
                logging.error(f"GraphQL Error: {data['errors']}")
                return None

            # Durchlaufen der Templates und Finden des passenden Templates.
            templates = data['data']['CertificateTemplateProgram']
            for program in templates:
                for template in program['CertificateTemplateText']:
                    if template['recordType'] == record_type and template['certificateType'] == certificate_type:
                        logging.info(f"Matching template found: {template['html']}")
                        return template['html']

            logging.error("No matching template found for the specified recordType and certificateType.")
            return None

        except requests.exceptions.RequestException as e:
            logging.error(f"An error occurred during the GraphQL request: {str(e)}")
            return None

    def prepare_text_content(self, enrollment, image):
        if self.certificate_type == "attendance" or self.certificate_type == "achievement":
            if self.certificate_type == "attendance":
                session_titles = self.get_attended_sessions(
                    enrollment, enrollment["Course"]["Sessions"]
                )
                return {
                    "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                    "course_name": enrollment["Course"]["title"],
                    "semester":enrollment["Course"]["Program"]["title"],
                    "event_entries": session_titles,
                    "template": image,
                    "ECTS": enrollment["Course"]["ects"]
            }
            else:
           
                learning_goals = enrollment["Course"]["learningGoals"].split(". ")
                learning_goals = [goal.strip() for goal in learning_goals if goal.strip()] 
                enrollment["learningGoalsList"] = learning_goals
                logging.info(f"Die Lernziele sind {enrollment}")
                return { 
                "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                "course_name": enrollment["Course"]["title"],
                "semester":enrollment["Course"]["Program"]["title"],
                "template": image,
                "ECTS": str(int(enrollment["Course"]["ects"]) * 30),
                "learningGoalsList": enrollment["learningGoalsList"],
                "praxisprojekt":enrollment["User"]["AchievementRecordAuthors"][0]["AchievementRecord"]["AchievementOption"]["title"]
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

    def generate_pdf_file_name(self, enrollment):
        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            return f"{enrollment['User']['id']}/{enrollment['Course']['id']}/{self.certificate_type}_certificate.pdf"
        else: 
            return f"{self.program_info['User']['id']}/{self.program_info['Course']['id']}/{self.certificate_type}_certificate.pdf"
    
    
    def get_attended_sessions(self, enrollment, sessions):
        attended_sessions = []
        logging.info(f"The givensessions are: {sessions}")

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
    try:
        certificate_creator = CertificateCreator(arguments)
        certificate_creator.create_certificates()
        logging.info("Certificates creation process completed.")
    except Exception as e:
        logging.error("Error in creating certificates: %s", str(e))
