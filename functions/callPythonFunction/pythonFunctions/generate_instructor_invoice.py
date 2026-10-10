"""Renders the invoice an instructor submits for their share of a course fee.

The first successful call locks the course's payment split for all instructors
(``CourseInstructorPayment.lockedAt``); afterwards only admins can change it.
"""
import logging
from datetime import datetime
from io import BytesIO
from zoneinfo import ZoneInfo

from jinja2 import Environment, DictLoader
from xhtml2pdf import pisa

from api_clients import EduHubClient, StorageClient


class InvoiceError(Exception):
    def __init__(self, message, message_key):
        self.message_key = message_key
        super().__init__(message)


def format_eur(cents):
    """Formats cents in German notation: 25000 -> '250,00 €', 123456 -> '1.234,56 €'."""
    formatted = f"{cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{formatted} €"


def full_name(user):
    return f"{user.get('firstName') or ''} {user.get('lastName') or ''}".strip()


def find_caller_instructor(course, user_id):
    for instructor in course.get("CourseInstructors") or []:
        if (instructor.get("User") or {}).get("id") == user_id:
            return instructor
    raise InvoiceError("You are not an instructor of this course", "NOT_COURSE_INSTRUCTOR")


def assert_split_complete(course):
    """Every instructor must have an entered share and the shares must add up to the total."""
    total = course["InstructorPayment"]["totalAmount"]
    instructors = course.get("CourseInstructors") or []
    if any(not instructor.get("PaymentShare") for instructor in instructors):
        raise InvoiceError(
            "Not every instructor has an amount entered", "PAYMENT_SPLIT_INCOMPLETE"
        )
    assigned = sum(instructor["PaymentShare"]["amount"] for instructor in instructors)
    if assigned != total:
        raise InvoiceError(
            f"The shares add up to {assigned} instead of {total}", "PAYMENT_SPLIT_INCOMPLETE"
        )


def build_invoice_context(course, instructor, today):
    user = instructor["User"]
    amount = instructor["PaymentShare"]["amount"]
    return {
        "full_name": full_name(user),
        "first_name": user.get("firstName") or "",
        "last_name": user.get("lastName") or "",
        "email": user.get("email") or "",
        "course_name": course.get("title") or "",
        "semester": (course.get("Program") or {}).get("title") or "",
        "amount": format_eur(amount),
        "total_amount": format_eur(course["InstructorPayment"]["totalAmount"]),
        "instructors": [
            {
                "full_name": full_name(other["User"]),
                "amount": format_eur(other["PaymentShare"]["amount"]),
            }
            for other in course["CourseInstructors"]
        ],
        "date": today.strftime("%d.%m.%Y"),
    }


def render_pdf(template_html, context):
    env = Environment(loader=DictLoader({"template": template_html}))
    rendered_html = env.get_template("template").render(context)
    pdf_bytes_io = BytesIO()
    pisa_status = pisa.CreatePDF(rendered_html, dest=pdf_bytes_io)
    if pisa_status.err:
        raise InvoiceError("Failed to create PDF with XHTML2PDF", "PDF_CREATION_FAILED")
    pdf_bytes_io.seek(0)
    return pdf_bytes_io


def generate_instructor_invoice(arguments, edu_hub_client=None, storage_client=None):
    try:
        user_id = (arguments.get("session_variables") or {}).get("x-hasura-user-id")
        course_id = arguments["input"]["courseId"]
        edu_hub_client = edu_hub_client or EduHubClient()

        course = edu_hub_client.fetch_instructor_payment_course(course_id)
        if not course:
            raise InvoiceError(f"Course {course_id} not found", "COURSE_NOT_FOUND")
        caller = find_caller_instructor(course, user_id)

        template = ((course.get("Program") or {}).get("InstructorInvoiceTemplate") or {}).get("html")
        if not template:
            raise InvoiceError("The program has no invoice template", "NO_INVOICE_TEMPLATE")
        if not course.get("InstructorPayment"):
            raise InvoiceError("No instructor fee is set for this course", "NO_PAYMENT_TOTAL")

        # A sole instructor gets the whole fee; there is nothing to split.
        if len(course["CourseInstructors"]) == 1:
            edu_hub_client.upsert_instructor_payment_share(
                caller["id"], course["InstructorPayment"]["totalAmount"]
            )

        # Lock first, then validate the freshly read split, so a co-instructor cannot
        # change a share between our check and the lock.
        locked_now = edu_hub_client.lock_instructor_payment(course_id)
        course = edu_hub_client.fetch_instructor_payment_course(course_id)
        try:
            assert_split_complete(course)
        except InvoiceError:
            if locked_now:
                edu_hub_client.unlock_instructor_payment(course_id)
            raise

        caller = find_caller_instructor(course, user_id)
        context = build_invoice_context(course, caller, datetime.now(ZoneInfo("Europe/Berlin")))
        pdf = render_pdf(template, context)

        path = f"{user_id}/{course_id}/instructor_invoice.pdf"
        storage_client = storage_client or StorageClient()
        storage_client.upload_file(
            path="", blob_name=path, buffer=pdf, content_type="application/pdf"
        )
        pdf.close()
        edu_hub_client.set_instructor_invoice_url(caller["PaymentShare"]["id"], path)

        logging.info(f"Generated instructor invoice for course {course_id}, user {user_id}")
        return {"success": True, "path": path, "messageKey": "INVOICE_GENERATED"}

    except InvoiceError as e:
        logging.warning(f"Instructor invoice not generated: {e}")
        return {"success": False, "error": str(e), "messageKey": e.message_key}
    except Exception as e:
        logging.error(f"Unexpected error generating instructor invoice: {e}")
        return {"success": False, "error": str(e), "messageKey": "UNEXPECTED_ERROR"}
