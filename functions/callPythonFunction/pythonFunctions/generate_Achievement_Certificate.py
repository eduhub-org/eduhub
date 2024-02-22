import asyncio
import requests
from graphqlclient import GraphQLClient
import logging

# Importieren Sie Ihre eigenen Hilfsfunktionen, ähnlich den `certificateUtils` in Ihrem Node.js-Code
from certificate_utils import get_storage_bucket_url, save_certificate_to_bucket, update_course_enrollment_record

logging.basicConfig(level=logging.DEBUG)

async def generate_achievement_certificate(course_enrollment, bucket):
    try:
        # Datenextraktion und Vorbereitung
        record_type = course_enrollment["User"]["AchievementRecordAuthors"][0]["AchievementRecord"]["AchievementOption"]["recordType"]
        record_title = course_enrollment["User"]["AchievementRecordAuthors"][0]["AchievementRecord"]["AchievementOption"]["title"]
        online_courses = record_title if record_type == "ONLINE_COURSE" else ""
        practical_project = record_title if record_type == "DOCUMENTATION" else ""

        # Zertifikatstext vorbereiten
        certificate_text = "\n".join([
            f"- {line.strip()}" for line in (course_enrollment["Course"]["learningGoals"] or "").split("\n") if line.strip() != ""
        ])

        # Zertifikatvorlage URL abrufen
        certificate_template_url = await get_storage_bucket_url(course_enrollment["Course"]["Program"]["achievementCertificateTemplateURL"], bucket)
        logging.debug(f"Certificate template URL retrieved: {certificate_template_url}")

        # Zertifikatsdaten konstruieren
        certificate_data = {
            "template": certificate_template_url,
            "full_name": f"{course_enrollment['User']['firstName']} {course_enrollment['User']['lastName']}",
            "semester": course_enrollment["Course"]["Program"]["title"],
            "course_name": course_enrollment["Course"]["title"],
            "ects": course_enrollment["Course"]["ects"],
            "practical_project": practical_project,
            "online_courses": online_courses,
            "certificate_text": certificate_text,
        }
        logging.debug(f"Certificate data: {certificate_data}")

        # Anfrage an den Zertifikatserstellungsdienst senden
        url = "https://edu-old.opencampus.sh/create_certificate_rest"
        response = requests.post(url, json=certificate_data)
        generated_certificate = response.json()

        # Generiertes Zertifikat speichern
        path = await save_certificate_to_bucket(
            generated_certificate,
            'achievement',
            course_enrollment['User']['id'],
            course_enrollment['Course']['id'],
            bucket,
            False
        )

        # Kursanmeldungsdatensatz aktualisieren
        await update_course_enrollment_record(
            course_enrollment['User']['id'],
            course_enrollment['Course']['id'],
            "achievementCertificateURL",
            path
        )
    except Exception as error:
        logging.error(f"Error generating certificate: {error}")
        raise

# Beispielhafter Aufruf der asynchronen Funktion
# asyncio.run(generate_achievement_certificate(course_enrollment, bucket))
