from jinja2 import Environment, FileSystemLoader
from sklearn import logger
from weasyprint import HTML, CSS
import os
from google.cloud import storage
import requests
from functions.callPythonFunction.api_clients.storage_client import StorageClient

    # TODO:
    # 1. Translate comments - Done
    # 2. Add wrapper function with user id list, course id, and certificate type as input (see index.json)
    # 3. Fetch all enrollments for the given user ids and course id
    # 4. Take first enrollment from the list to fetch the certificateURL and the certificateTextId of the course's program - Image and Text is the same for everyone in the course -> just one retrieve needed
        # 5. Fetch the certificate text from the certificateTextId
        # 6. Fetch image from the certificateURL
    # 7. Iterate over all enrollments to create the certificates, upload them to GCS, and update the enrollment record
    # 8. Integrate all functions to fetch and save data in Hasura in the EduHub backend API

"""example_data = {
    "template": "/Users/sinalucke/Desktop/eduhub/edu_zertifikat_SOSE2023.png",
    "request": {
        "host_with_port": "example.com:8000"
    },
    "user": {
        "full_name": "Max Mustermann"
    },
    "course": {
        "semester": "Sommersemester 2023",
        "name": "Einführung in die Programmierung",
        "certificate_text": "Hier steht der Text, der für das Zertifikat relevant ist.",
        "ects": 5,
        "referent":{
            "user" : {
                "id": 3, 
                "full_name": "Max Musterreferent"
            }

        }, 
        "certificate_list_events": True,
        "events": [
            {
                "title": "Einführungsveranstaltung",
                "referent": {
                    "user": {
                        "id": 1,
                        "full_name": "Dr. Maria Schmidt"
                    }
                }
            },
            {
                "title": "Abschlusspräsentation",
                "referent": {
                    "user": {
                        "id": 2,
                        "full_name": "Prof. Johann Bauer"
                    }
                }
            }
        ]
    },
    "project": {
        "title": "Forschungsprojekt XYZ",
        "mentor": {
            "company": None,
            "user": {
                "full_name": "Luise Müller"
            }
        }
    },
    "enrollment": {
        "practical_project": "Praxisprojekt ABC"
    },
    "datetime_now": "15.11.2023",
    "attendance": {
        "absence": False
    }
}


"""

def create_certificate(hasura_secret, arguments):
    user_ids = arguments["input"]["userIds"]
    course_id = arguments["input"]["courseId"]
    certificate_type = arguments["input"]["certificateType"]

    logger.debug(
    "Input parameters: userIds=${userIds}, courseId=${courseId}, certificateType=${certificateType}"
  )


    # Fetch course enrollments
    try:
        enrollments = fetch_enrollments(user_ids, course_id)
    except Exception as e:
        print(f"Error when retrieving registrations: {e}")
        return

    # Check if enrollments exist
    if not enrollments:
        print("No enrollments were found.")
        return

    # Generating Certificates per enrollment
    for enrollment in enrollments:
        try:
            bucket_name = "UnserBucketName"  # TODO muss mit storage_client noch gelöst werden 
            pdf_url = generate_certificate(enrollment, certificate_type, bucket_name)

            update_course_enrollment_record(enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url)
        except Exception as e:
            print(f"Error when generating certificate: {e}")

    print(f"{len(enrollments)} {certificate_type} Certificate(s) generated.")

# Example Parameters for Testing
# create_certificate(["user1", "user2"], "course123", "attendance")


def generate_certificate(enrollment, certificate_type, bucket_name):

    # Prepare Certificate Data
    certificate_data = prepare_certificate_data(enrollment, certificate_type)
    html_template = f"{certificate_type}_certificate.html"

    # Generate PDF and Upload to GCS
    pdf_file_name = generate_pdf_file_name(enrollment, certificate_type)
    pdf_url = generate_pdf_and_upload_to_gcs(
        certificate_data, enrollment, certificate_type, bucket_name, pdf_file_name
    )

    # Update the course enrollment with url to pdf
    update_course_enrollment_record(
        enrollment["User"]["id"], enrollment["Course"]["id"], pdf_url
    )

    return pdf_url


####################################Helper###################################
def prepare_certificate_data(enrollment, certificate_type):
    if certificate_type == "attendance":
        session_titles = get_attended_sessions(
            enrollment, enrollment["Course"]["Sessions"]
        )
        template_url = enrollment["Course"]["Program"][
            "attendanceCertificateTemplateURL"
        ]
    elif certificate_type == "achievement":
        session_titles = None 
        template_url = enrollment["Course"]["Program"][
            "achievementCertificateTemplateURL"
        ]
    else:
        raise ValueError("Invalid certificate type")

    return {
        "template": template_url,
        "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
        "course_name": enrollment["Course"]["title"],
        "semester": enrollment["Course"]["Program"]["title"],
        "event_entries": session_titles,
    }


"""funktionierende Version
def generate_pdf(data, image, html):
    #Hier muss ich nochmal was anpassen 
    base_url = os.path.dirname(os.path.realpath("/Users/sinalucke/Desktop/eduhub"))
    env = Environment(loader=FileSystemLoader('/Users/sinalucke/Desktop/eduhub'))
    template = env.get_template('html')
    # HTML-String aus Jinja2-Rendering
    html_content = template.render(data)

    # Erstellen der PDF mit Angabe des base_url
    HTML(string=html_content, base_url=base_url).write_pdf("output.pdf")"""


def generate_pdf_file_name(enrollment, certificate_type):
    return f"{enrollment['User']['id']}/{enrollment['Course']['id']}/{certificate_type}_certificate.pdf"


def download_template(url):
    response = requests.get(url)
    response.raise_for_status()  # Makes sure request was succesfull
    return response.text


def generate_pdf_and_upload_to_gcs(
    data, enrollment, certificate_type, bucket_name, pdf_file_name
):
    if certificate_type == "attendance":
        template_url = enrollment["Course"]["Program"][
            "attendanceCertificateTemplateURL"
        ]
    elif certificate_type == "achievement":
        template_url = enrollment["Course"]["Program"][
            "achievementCertificateTemplateURL"
        ]

    template_content = download_template(template_url)
    # Create Jinja Environment and loading Image Template from String 
    env = Environment()
    template = env.from_string(template_content)
    html_content = template.render(data)

    pdf = HTML(string=html_content).write_pdf()

    storage_client = StorageClient()
    storage_client.upload_file(pdf_file_name, pdf, bucket_name)

    return storage_client.get_blob_url(pdf_file_name)


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

def fetch_enrollments(hasura_endpoint, hasura_admin_secret, user_ids, course_id):
    return 0