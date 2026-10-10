"""Renders certificates confirming that someone instructed a course.

Each course uses its program's INSTRUCTOR_CERTIFICATE template. Courses that cannot be
processed (no template, missing background image, not managed by the calling org admin)
are skipped and reported instead of failing the whole batch.
"""
import logging
from datetime import datetime
from html import escape
from io import BytesIO
from zoneinfo import ZoneInfo

from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa

from api_clients import EduHubClient, StorageClient

# Same capability per program type as the org_admin_access update filter on Course.
CAPABILITY_BY_PROGRAM_TYPE = {
    "COURSES": "canManageCourses",
    "EVENTS": "canManageEvents",
    "DEGREES": "canManageDegrees",
}


def may_manage_course(course, role):
    if role == "admin":
        return True
    program = course.get("Program") or {}
    capability = CAPABILITY_BY_PROGRAM_TYPE.get(program.get("type"))
    admins = (program.get("Organization") or {}).get("OrganizationAdmins") or []
    return any(a.get("canManageSettings") or (capability and a.get(capability)) for a in admins)


def build_certificate_context(course, user, image, today):
    sessions = [s.get("title") for s in course.get("Sessions") or [] if s.get("title")]
    return {
        "full_name": f"{user.get('firstName') or ''} {user.get('lastName') or ''}".strip(),
        "course_name": course.get("title") or "",
        "semester": (course.get("Program") or {}).get("title") or "",
        "session_entries": "".join(f"<li>{escape(title)}</li>" for title in sessions),
        "ECTS": course.get("ects") or "",
        "date": today.strftime("%d.%m.%Y"),
        "template": image,
    }


def render_pdf(template_html, context):
    env = Environment(loader=DictLoader({"template": template_html}))
    rendered_html = env.get_template("template").render(context)
    pdf_bytes_io = BytesIO()
    if pisa.CreatePDF(rendered_html, dest=pdf_bytes_io).err:
        raise ValueError("Failed to create PDF with XHTML2PDF")
    pdf_bytes_io.seek(0)
    return pdf_bytes_io


def create_instructor_certificates(arguments, edu_hub_client=None, storage_client=None):
    try:
        session = arguments.get("session_variables") or {}
        role = session.get("x-hasura-role")
        user_id = session.get("x-hasura-user-id")
        course_ids = arguments["input"]["courseIds"]
        if not course_ids:
            return {"success": True, "count": 0, "skippedCourseIds": [], "messageKey": "NO_COURSES_SELECTED"}

        edu_hub_client = edu_hub_client or EduHubClient()
        storage_client = storage_client or StorageClient()
        # Calls with the admin secret carry no user id; the nil UUID matches no org admin.
        courses = edu_hub_client.fetch_instructor_certificate_courses(
            course_ids, user_id or "00000000-0000-0000-0000-000000000000"
        )
        found_ids = {course["id"] for course in courses}
        skipped = [course_id for course_id in course_ids if course_id not in found_ids]
        today = datetime.now(ZoneInfo("Europe/Berlin"))
        count = 0

        for course in courses:
            program = course.get("Program") or {}
            template = (program.get("InstructorCertificateTemplate") or {}).get("html")
            if not may_manage_course(course, role) or not template:
                logging.warning(f"Skipping instructor certificates for course {course['id']}")
                skipped.append(course["id"])
                continue
            try:
                image_url = program.get("attendanceCertificateTemplateURL")
                image = storage_client.download_image_from_gcs(image_url) if image_url else ""
                for instructor in course.get("CourseInstructors") or []:
                    user = instructor["User"]
                    pdf = render_pdf(template, build_certificate_context(course, user, image, today))
                    path = f"{user['id']}/{course['id']}/instructor_certificate.pdf"
                    storage_client.upload_file(
                        path="", blob_name=path, buffer=pdf, content_type="application/pdf"
                    )
                    pdf.close()
                    edu_hub_client.set_instructor_certificate_url(instructor["id"], path)
                    count += 1
            except Exception as e:
                logging.error(f"Instructor certificates for course {course['id']} failed: {e}")
                skipped.append(course["id"])

        return {
            "success": True,
            "count": count,
            "skippedCourseIds": skipped,
            "messageKey": "INSTRUCTOR_CERTIFICATES_GENERATED",
        }
    except Exception as e:
        logging.error(f"Unexpected error creating instructor certificates: {e}")
        return {"success": False, "error": str(e), "messageKey": "UNEXPECTED_ERROR"}
