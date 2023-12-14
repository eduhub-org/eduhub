from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS 
import os
from google.cloud import storage
import requests
from functions.callPythonFunction.api_clients.storage_client import StorageClient 

'''example_data = {
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


'''



def create_certificate(enrollment, certificate_type, bucket_name):
    # Zertifikatsdaten vorbereiten
    certificate_data = prepare_certificate_data(enrollment, certificate_type)
    html_template = f'{certificate_type}_certificate.html'

    # Generieren des PDFs und Hochladen auf GCS
    pdf_file_name = generate_pdf_file_name(enrollment, certificate_type)
    pdf_url = generate_pdf_and_upload_to_gcs(certificate_data, enrollment, certificate_type, bucket_name, pdf_file_name)

    # Aktualisieren des Kursanmeldedatensatzes
    update_course_enrollment_record(enrollment['User']['id'], enrollment['Course']['id'], pdf_url)

    return pdf_url
        

 


####################################Helper###################################
def prepare_certificate_data(enrollment, certificate_type):
    if certificate_type == "attendance":
        session_titles = get_attended_sessions(enrollment, enrollment["Course"]["Sessions"])
        template_url = enrollment["Course"]["Program"]["attendanceCertificateTemplateURL"]
    elif certificate_type == "achievement":
        # Logik für Achievement-Zertifikate (falls erforderlich)
        session_titles = None  # Oder entsprechende Logik
        template_url = enrollment["Course"]["Program"]["achievementCertificateTemplateURL"]
    else:
        raise ValueError("Invalid certificate type")

    return {
        "template": template_url,
        "full_name": f"{enrollment['User']['firstName']} {enrollment['User']['lastName']}",
        "course_name": enrollment["Course"]["title"],
        "semester": enrollment["Course"]["Program"]["title"],
        "event_entries": session_titles,
    }

'''funktionierende Version
def generate_pdf(data, image, html):
    #Hier muss ich nochmal was anpassen 
    base_url = os.path.dirname(os.path.realpath("/Users/sinalucke/Desktop/eduhub"))
    env = Environment(loader=FileSystemLoader('/Users/sinalucke/Desktop/eduhub'))
    template = env.get_template('html')
    # HTML-String aus Jinja2-Rendering
    html_content = template.render(data)

    # Erstellen der PDF mit Angabe des base_url
    HTML(string=html_content, base_url=base_url).write_pdf("output.pdf")'''


def generate_pdf_file_name(enrollment, certificate_type):
    return f"{enrollment['User']['id']}/{enrollment['Course']['id']}/{certificate_type}_certificate.pdf"

def download_template(url):
    response = requests.get(url)
    response.raise_for_status()  # Stellt sicher, dass die Anfrage erfolgreich war
    return response.text

def generate_pdf_and_upload_to_gcs(data, enrollment, certificate_type, bucket_name, pdf_file_name):
    if certificate_type == "attendance":
        template_url = enrollment["Course"]["Program"]["attendanceCertificateTemplateURL"]
    elif certificate_type =="achievement":
        template_url = enrollment["Course"]["Program"]["achievementCertificateTemplateURL"]

    template_content = download_template(template_url)
    #Jinja Environment erstellen und Template aus String laden 
    env = Environment()
    template = env.from_string(template_content)
    html_content = template.render(data)

    pdf = HTML(string=html_content).write_pdf()

    storage_client = StorageClient()
    storage_client.upload_file(pdf_file_name, pdf, bucket_name)

    return storage_client.get_blob_url(pdf_file_name)

def update_course_enrollment_record(user_id, course_id, certificate_url):
    # Setzen der GraphQL-Endpunkt-URL
    hasura_endpoint = os.environ.get("HASURA_ENDPOINT")

    # Setzen des Hasura Admin Secrets
    headers = {
        "x-hasura-admin-secret": os.environ.get("HASURA_ADMIN_SECRET")
    }

    # GraphQL-Mutation, um den Kursanmeldedatensatz zu aktualisieren
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

    # Daten für die GraphQL-Mutation
    variables = {
        "userId": user_id,
        "courseId": course_id,
        "certificateUrl": certificate_url
    }

    # Senden der Anfrage
    response = requests.post(hasura_endpoint, json={'query': mutation, 'variables': variables}, headers=headers)

    # Überprüfen der Antwort
    if response.status_code != 200:
        raise Exception(f"Failed to update course enrollment record: {response.text}")

    # Ergebnis der Mutation
    result = response.json()
    return result

def get_attended_sessions(enrollment, sessions):
    attended_sessions = []

    for session in sessions:
        # Alle Anwesenheitsaufzeichnungen für eine einzelne Sitzung abrufen
        attendances_for_session = [
            attendance for attendance in enrollment.get("User", {}).get("Attendances", [])
            if attendance.get("Session", {}).get("id") == session.get("id")
        ]

        # Die neueste Anwesenheitsaufzeichnung nach höchster ID auswählen
        if attendances_for_session:
            attendances_for_session.sort(key=lambda x: x.get("id"), reverse=True)
            last_attendance = attendances_for_session[0]

            # Neue Anwesenheit nur hinzufügen, wenn der Status "ATTENDED" ist
            if last_attendance.get("status") == "ATTENDED":
                attended_sessions.append({
                    "sessionTitle": session.get("title"),
                    # "date": session.get("startDateTime"),  # Optional, falls das Datum benötigt wird
                    # "status": last_attendance.get("status", "NO_INFO"),  # Optional, falls der Status benötigt wird
                })

    # Sortieren der Sitzungstitel nach Startdatum der Sitzung
    # Achtung: Datun muss das richtige Format haben!
    attended_sessions.sort(key=lambda x: x.get("date"))

    # Titel der besuchten Sitzungen extrahieren
    attended_session_titles = [session["sessionTitle"] for session in attended_sessions if session["sessionTitle"] is not None]

    return attended_session_titles
