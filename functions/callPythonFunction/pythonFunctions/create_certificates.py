from jinja2 import Environment, FileSystemLoader
from logging import logger
from weasyprint import HTML, CSS
import os
from google.cloud import storage
import requests
from functions.callPythonFunction.api_clients.storage_client import StorageClient
import io 

    # TODO:
    # 1. Translate comments - Done
    # 2. Add wrapper function with user id list, course id, and certificate type as input (see index.json) - Done
    # 3. Fetch all enrollments for the given user ids and course id - Done 
    # 4. Take first enrollment from the list to fetch the certificateURL and the certificateTextId of the course's program - Image and Text is the same for everyone in the course -> just one retrieve needed
        # 5. Fetch the certificate text from the certificateTextId - Done
        # 6. Fetch image from the certificateURL - Done
    # 7. Iterate over all enrollments to create the certificates, upload them to GCS, and update the enrollment record - Done 
    # 8. Integrate all functions to fetch and save data in Hasura in the EduHub backend API

def create_certificate(hasura_secrets, arguments):
    storage_client = StorageClient()
    user_ids = arguments["input"]["userIds"]
    course_id = arguments["input"]["courseId"]
    certificate_type = arguments["input"]["certificateType"]
   
    logger.debug(
    "Input parameters: userIds=${userIds}, courseId=${courseId}, certificateType=${certificateType}"
    )
    try:
        enrollments = fetch_enrollments(user_ids, course_id)
    except Exception as e:
        print(f"Error when retrieving registrations: {e}")
        return

  # Check if enrollments exist

    if not enrollments:
        print("No enrollments were found.")
        return
   
    template_image_url = fetch_template_image(enrollments, certificate_type)
    template_text = fetch_template_text(enrollments, certificate_type)


  # Generating Certificates per enrollment


    for enrollment in enrollments:
        try:
            pdf_url = generate_and_save_certificate_to_gcs(enrollment, certificate_type, template_image_url, template_text, storage_client.get_bucket())

            update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url)
        except Exception as e:
          print(f"Error when generating certificate: {e}")

    print(f"{len(enrollments)} {certificate_type} Certificate(s) generated.")

def generate_and_save_certificate_to_gcs(enrollment, certificate_type, template_image_url, template_text, bucket_name):
    # Prepare Text Conten 
    text_content = prepare_text_content(enrollment, certificate_type) 
    # Generate PDF File Name
    pdf_file_name = generate_pdf_file_name(enrollment, certificate_type)
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


def update_course_enrollment_record(user_id, course_id, certificate_url):
    hasura_endpoint = os.environ.get("HASURA_ENDPOINT")

    headers = {"x-hasura-admin-secret": os.environ.get("HASURA_ADMIN_SECRET")}

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
        "userId": user_id,
        "courseId": course_id,
        "certificateUrl": certificate_url,
    }

    response = requests.post(
        hasura_endpoint,
        json={"query": mutation, "variables": variables},
        headers=headers,
    )

    if response.status_code != 200:
        raise Exception(f"Failed to update course enrollment record: {response.text}")

    result = response.json()
    return result

################################## Helper Functions ########################
def fetch_enrollments(user_ids, course_id):
    # GraphQL endpoint
    hasura_endpoint = os.getenv('HASURA_ENDPOINT')
    hasura_admin_secret = os.getenv('HASURA_ADMIN_SECRET')

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
      "userIds": user_ids,
      "courseId": course_id
    }

    # Headers including the admin secret
    headers = {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": hasura_admin_secret
    }

    # Make the request to the GraphQL endpoint
    try:
        response = requests.post(
                hasura_endpoint,
                json={'query': query, 'variables': variables},
                headers=headers
        )
        response.raise_for_status()  # Raises a HTTPError if the HTTP request returned an unsuccessful status code
    # Assuming the data is returned in JSON format
        data = response.json()
        return data['data']['CourseEnrollment']
    except requests.exceptions.RequestException as e:
        # Handle any errors that occur during the request
        print(f"An error occurred: {e}")
        raise
 

def fetch_template_image(enrollments, certificate_type):
    if certificate_type == "achievement":
        image_url = [0]['Course']['Program']['achievementCertificateTemplateURL']
        return image_url
    elif certificate_type == "attendance":
        image_url = [0]['Course']['Program']['attendanceCertificateTemplateURL']
        return image_url
    else: 
        print("certificate type is incorrect or missing!")


def fetch_template_text(enrollments, certificate_type):
    # GraphQL endpoint
    hasura_endpoint = os.getenv('HASURA_ENDPOINT')
    hasura_admin_secret = os.getenv('HASURA_ADMIN_SECRET')

    # Necessary Data to retrieve HTML from hasura 
    if certificate_type == "achievement":
        text_id = [0]['Course']['Program']['achievementCertificateTemplateTextId']

    elif certificate_type == "attendance":
        text_id = [0]['Course']['Program']['attendanceCertifiateTemplateTextId']
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
    "x-hasura-admin-secret": hasura_admin_secret
    }

    # Make the request to the GraphQL endpoint
    try:
        response = requests.post(
          hasura_endpoint,
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

    
def prepare_text_content(enrollment, certificate_type):
    if certificate_type == "attendance":
        session_titles = get_attended_sessions(
            enrollment, enrollment["Course"]["Sessions"]
        )
    elif certificate_type == "achievement":
        session_titles = None 
    else:
        raise ValueError("Invalid certificate type")

    return {
        "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
        "course_name": enrollment["Course"]["title"],
        "semester": enrollment["Course"]["Program"]["title"],
        "event_entries": session_titles,
        }

def generate_pdf_file_name(enrollment, certificate_type):
    return f"{enrollment['User']['id']}/{enrollment['Course']['id']}/{certificate_type}_certificate.pdf"


def download_template_image(template_image_url):
    response = requests.get(url)
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

