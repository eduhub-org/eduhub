from urllib.request import urlopen
from jinja2 import Environment, FileSystemLoader
import logging
import jinja2
import os
import requests
from api_clients import EduHubClient, StorageClient
import io 
from fpdf import FPDF
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader


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
        logging.info(f"The template text is: {template_text}")
        successful_count = 0
        
        logging.info("############################################################")
        logging.info(f"Enrollments:{self.enrollments}")
        logging.info(f"The template image url is {template_image_url}")
        logging.info(f"The template text id  is {template_text}")
    
    
        for i, enrollment in enumerate(self.enrollments, 1):
            try:
                pdf_url = self.generate_and_save_certificate_to_gcs(template_image_url, template_text, enrollment)
                
                logging.info(f"The pdf_url is: {pdf_url}")

                self.eduhub_client.update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url, self.certificate_type)
                successful_count += 1
            except Exception as e:
                logging.error(f"Error in processing enrollment {i}: {e}")
    
        logging.info(f"{successful_count}/{len(self.enrollments)} {self.certificate_type} certificate(s) successfully   generated.")



    def generate_and_save_certificate_to_gcs(self, enrollment, template_image_url, template_text):
        # Prepare Text Content
        text_content = self.prepare_text_content(enrollment)

        image = self.storage_client.download_file(template_image_url)
        logging.info(f"Das ist das image: {image}")


        # Create Jinja2 Environment and render HTML
        env = Environment(loader=DictLoader({'template': template_text}))
        template = env.get_template('template')
        template_content = text_content
        #template_content["template"] = template_image_url
        rendered_html = template.render(template_content)

        pdf = PDFWithBackground(image)
        #pdf = PDFWithBackground()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.chapter_title('Test')
        pdf.chapter_body(rendered_html)

# Speichere das PDF im Speicher als Bytes
        pdf_bytes_io = BytesIO()
        pdf.output(pdf_bytes_io, 'S')
        pdf_bytes_io.seek(0) 

        pdf_file_name = self.generate_pdf_file_name(enrollment)
        # Erstelle ein Blob im Bucket und lade die PDF-Bytes hoch   
        # TODO: Für Production wahrscheinlich anpassen und wieder so reinnehmen      
        '''blob = bucket.blob(pdf_file_name)
        blob.upload_from_file(path="", blob_name=pdf_file_name, buffer=pdf_bytes_io, content_type='application/pdf')
        # Option: URL zum Zugriff auf das PDF generieren
        url = blob.public_url'''

        url = self.storage_client.upload_file(path="", blob_name=pdf_file_name, buffer=pdf_bytes_io, content_type='application/pdf')
        logging.info(f'Das PDF ist hier verfügbar: {url}') 


 
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
        logging.info("fetch_template_text gets called")
        
        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            
            if self.certificate_type == "achievement":
                text_id =self.enrollments[0]['Course']['Program']['achievementCertificateTemplateTextId']
            else:
                text_id = self.enrollments[0]['Course']['Program']['attendanceCertifiateTemplateTextId']
            
        else: 
            logging.info("Certificate type is incorrect or missing!")

        
        # GraphQL query
        query = """
        query getHTML($textId: Int!) {
            CertificateTemplateText(where: {id: {_eq: $textId}}) {
                html
            }
        }
        """
        variables = {
                "textId": text_id
            }

        logging.info(f" text id is: {text_id}")
        # Headers including the admin secret
        headers = {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret
        }

        logging.info(f"THe headers is: {headers}")
        
        # Make the request to the GraphQL endpoint
        try:
            response = requests.post(
            self.eduhub_client.url,
            json={'query': query, 'variables': variables},
            headers=headers
        )
            response.raise_for_status()  # Raises a HTTPError if the HTTP request returned an unsuccessful status code

            # Assuming the data is returned in JSON format
            data = response.json()
            logging.info(f"The data is: {data}")
            logging.info("----------------------------------------------------------------")
            logging.info(f"The data is: {data['data']['CertificateTemplateText'][0]['html']}")
            return data['data']['CertificateTemplateText'][0]['html']
        except requests.exceptions.RequestException as e:
        # Handle any errors that occur during the request
            logging.info("An error occured")

    def prepare_text_content(self, enrollment):
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
                    "template": "",
            }
            else:
                return {
                "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
                "course_name": enrollment["Course"]["title"],
                "semester":enrollment["Course"]["Program"]["title"],
                "template": "",
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


class PDFWithBackground(FPDF):
    def __init__(self, background_image_blob):
        super().__init__()
        logging.info(f"Das ist die background_url: {background_url}")
        self.background_url = background_url
        # Download the background image
        response = requests.get(self.background_url)
        logging.info("bis hier hin funktioniert es")
        self.background_image = BytesIO(response.content)

    def header(self):
        # This method is automatically called on document start and when a new page is added
        '''if self.page_no() == 1:
            # Add a background image only for the first page or as needed
            self.image(self.background_image, x=0, y=0, w=210, h=297)'''

    def footer(self):
        # Footer content here
        pass

    def chapter_title(self, label):
        # Chapter title styling
        self.set_font('Arial', '', 12)
        self.cell(0, 10, f'{label}', 0, 1)

    def chapter_body(self, body):
        # Process HTML-like tags in body
        self.set_font('Arial', '', 12)
        html = body.split('\n')
        for line in html:
            if '<b>' in line:
                self.set_font('', 'B')
                line = line.replace('<b>', '').replace('</b>', '')
            if '<i>' in line:
                self.set_font('', 'I')
                line = line.replace('<i>', '').replace('</i>', '')
            if '<u>' in line:
                self.set_font('', 'U')
                line = line.replace('<u>', '').replace('</u>', '')
            if '<p>' in line:
                self.multi_cell(0, 10, line.replace('<p>', '').replace('</p>', ''))
                self.ln()
            else:
                self.cell(0, 10, line, 0, 1)
            self.set_font('Arial', '', 12) 




# from fpdf import FPDF
# from PIL import Image
# from io import BytesIO

# # Assuming blob_bytes contains the bytes of the image
# image_stream = BytesIO(blob_bytes)

# # Convert the bytes to an image
# image = Image.open(image_stream)

# # Save the image to a new BytesIO object in a format that FPDF can understand
# image_stream = BytesIO()
# image.save(image_stream, format='JPEG')  # or 'PNG' if your image is a PNG
# image_stream.seek(0)

# pdf = FPDF()

# # You need to add a page before you can add an image
# pdf.add_page()

# # Add the image to the PDF
# pdf.image(image_stream, x=10, y=10, w=100, h=100)

# # Output the PDF to a file
# pdf.output('output.pdf', 'F')