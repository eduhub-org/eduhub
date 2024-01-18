from jinja2 import Environment, FileSystemLoader
from logging import logger
from weasyprint import HTML, CSS
import os
from google.cloud import storage
import requests
from functions.callPythonFunction.api_clients.storage_client import StorageClient
import io 

# TODO:

# 1. **`fetch_enrollments` Method:**
#    - Purpose: To fetch enrollment data based on user IDs and course ID.
#    - Inputs: List of user IDs, Course ID.
#    - Output: Enrollment data.

# 2. **`fetch_template_image` and `fetch_template_text` Methods:**
#    - Purpose: To fetch the template image URL and template text based on the certificate type.
#    - Inputs: Enrollments data, Certificate type.
#    - Output: Template image URL and template text.

# 3. **`prepare_certificate_content` Method:**
#    - Purpose: To prepare the content to be inserted into the certificate, like user name, course details, etc.
#    - Inputs: Enrollment data, Certificate type.
#    - Output: Prepared text content for the certificate.

# 4. **`generate_pdf_file_name` Method:**
#    - Purpose: To generate a unique and descriptive file name for the certificate PDF.
#    - Inputs: Enrollment data, Certificate type.
#    - Output: PDF file name.

# 5. **`render_certificate_to_pdf` Method:**
#    - Purpose: To render the HTML template with the certificate data into a PDF.
#    - Inputs: Template image URL, HTML content, additional styling if necessary.
#    - Output: PDF file in memory (e.g., as a BytesIO object).

# 6. **`upload_certificate_to_storage` Method:**
#    - Purpose: To upload the generated certificate PDF to Google Cloud Storage.
#    - Inputs: PDF BytesIO object, File name, Bucket name.
#    - Output: Public URL of the uploaded file.

# 7. **`update_enrollment_record` Method:**
#    - Purpose: To update the course enrollment record with the certificate URL.
#    - Inputs: User ID, Course ID, Certificate URL.

# 8. **`download_template_image` Method:**
#    - Purpose: To download the certificate image template if needed.
#    - Inputs: Template image URL.
#    - Output: Image data.

# 9. **`get_attended_sessions` Method:**
#    - Purpose: To extract information about attended sessions for attendance certificates.
#    - Inputs: Enrollment data, Sessions data.
#    - Output: List of attended sessions.

# 10. **`generate_certificate_for_enrollment` Method:**
#     - Purpose: To encapsulate the entire process of generating a certificate for a single enrollment.
#     - Inputs: Enrollment data.
#     - Output: Certificate URL or an indication of success/failure.

# 11. **`process_certificates` Method:**
#     - Purpose: Main method to process certificates for a batch of enrollments.
#     - Inputs: User IDs, Course ID, Certificate type.
#     - Output: Status of the process, e.g., number of certificates generated.



class CertificateCreator:
    def __init__(self, storage_client, eduhub_client, arguments):
        self.storage_client = storage_client
        self.eduhub_client = eduhub_client
        self.certificate_type = arguments["input"]["certificateType"]
        self.user_ids = arguments["input"]["userIds"]
        self.course_id = arguments["input"]["courseId"] 
        self.enrollments = None
        self.program_info = None

        if self.certificate_type in ["achievement", "attendance"]:
            self.enrollments = self._fetch_enrollments(self.user_ids, self.course_id)
        else:
            self.program_info = self._fetch_program_info(self.course_id)



    def create_certificates(self):
        template_image_url = self.fetch_template_image()
        template_text = self.fetch_template_text()

        if self.certificate_type == "achievement" or self.certificate_type == "attendance":
            for enrollment in self.enrollments:
                pdf_url = generate_and_save_certificate_to_gcs(template_image_url, template_text, self.storage_client.get_bucket())

                self.update_course_enrollment_record(pdf_url)
        else: 
                pdf_url = generate_and_save_certificate_to_gcs(template_image_url, template_text, self.storage_client.get_bucket())

                self.update_course_enrollment_record(pdf_url)


        logging.info(f"{len(self.enrollments)} {self.certificate_type} Certificate(s) generated.")

    def generate_and_save_certificate_to_gcs(self, template_image_url, template_text, bucket_name):
        # Prepare Text Conten 
        text_content = prepare_text_content() 
        # Generate PDF File Name
        pdf_file_name = generate_pdf_file_name()
        # Get Template Image
        #template_image = download_template_image(template_image_url)

        ## Generate Certificate PDF 
        # Create Jinja2 Environment
        env = Environment(loader=jinja2.DictLoader({'template': template_text}))

        template = env.get_template('template')

        rendered_html = template.render(background_image_url=template_image_url, html_content=text_content)

        # create PDF as BytesIO Object
        pdf_bytes_io = io.BytesIO()
        HTML(string=rendered_html).write_pdf(pdf_bytes_io)

        pdf_bytes_io.seek(0)

        temporary_pdf = pdf_bytes_io

        ## Saving Certificate PDF
        #Instantiiating GCS Client
        storage_client = storage.Client()

    
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(pdf_file_name)

        blob.upload_from_file(temporary_pdf, content_type='application/pdf')

        return blob.public_url

    def update_course_enrollment_record(self, certificate_url):
       
        # GraphQL-Mutations to Update Course Enrollment
        mutation = """
        mutation UpdateEnrollment($userId: uuid!, $courseId: Int!, $certificateUrl: String!) {
            update_CourseEnrollment(
                where: { userId: { _eq: $userId }, courseId: { _eq: $courseId } }
                _set: { certificateURL: $certificateUrl }
            ) {
                affected_rows
            }
        }
        """

        # Data for the GraphQL-Mutation
        variables = {
            "userId": self.user_id,
            "courseId": self.course_id,
            "certificateUrl": certificate_url,
        }

        response = requests.post(
            self.eduhub_client.hasura_endpoint,
            json={"query": mutation, "variables": variables},
            headers=self.eduhub_client.headers,
        )

        if response.status_code != 200:
            logging.error(f"Failed to update course enrollment record: {response.text}")
            

        result = response.json()
        return result
        
    def fetch_enrollments(self):


        # GraphQL query
        query = """
        query GetEnrollments($userIds: [uuid!]!, $courseId: Int!) {
  CourseEnrollment(where: {userId: {_in: $userIds}, Course: {id: {_eq: $courseId}}}) {
    User {
      Attendances {
        Session {
          id
          startDateTime
        }
        id
        status
      }
      firstName
      lastName
      AchievementRecordAuthors(where: {AchievementRecord: {AchievementOption: {AchievementOptionCourses: {Course: {id: {_eq: $courseId}}}}}}, order_by: {AchievementRecord: {updated_at: desc}}, limit: 1) {
        AchievementRecord {
          AchievementOption {
            title
            recordType
          }
          created_at
        }
      }
      id
    }
    Course {
      Program {
        title
        achievementCertificateTemplateURL
        attendanceCertificateTemplateURL
        attendanceCertificateTemplateTextId
        achievementCertificateTemplateTextId
      }
      Sessions(order_by: {startDateTime: asc}) {
        id
        title
        startDateTime
      }
      id
      ects
      title
      learningGoals
    }
  }
}

    """
     # Variables for the GraphQL query
        variables = {
        "userIds": self.user_ids,
        "courseId": self.course_id 
        }

     # Headers including the admin secret
        headers = {
        "Content-Type": "application/json",
        "x-hasura-admin-secret":  self.eduhub_client.hasura_admin_secret
        }

    # Make the request to the GraphQL endpoint
        try:
            response = requests.post(
            self.eduhub_client.url,
            headers={"x-hasura-admin-secret": self.eduhub_client.hasura_admin_secret},
            json={"query": query, "variables": {"userIds": self.user_ids, "courseId": self.course_id}}
            )
            response.raise_for_status()  # Raises a HTTPError if the HTTP request returned an unsuccessful status code
        # Assuming the data is returned in JSON format
            data = response.json()
            return data['data']['CourseEnrollment']
        except requests.exceptions.RequestException as e:
            # Handle any errors that occur during the request
            logging.error(f"An error occurred: {e}")
            raise

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
        print(f"An error occurred: {e}")
        raise

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
