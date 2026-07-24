import logging
import os
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient

# How long before an invitation expires we send the "expiring soon" reminder.
REMINDER_LEAD_HOURS = 24


def _escape_html(text):
    """Minimal HTML escaping for user-controlled values interpolated into mail bodies."""
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def _get_default_mail_template(client, template_type):
    """Fetch the default (courseId NULL) mail template of the given type."""
    query = """
    query GetInvitationMailTemplate($type: MailTemplateType_enum!) {
        MailTemplate(where: {type: {_eq: $type}, courseId: {_is_null: true}}, limit: 1) {
            subject
            content
            from
            cc
            bcc
        }
    }
    """
    result = client.send_query(query, {"type": template_type})
    if not isinstance(result, dict) or result.get("errors"):
        logging.warning(f"Could not load mail template {template_type}: {result}")
        return None
    templates = result.get("data", {}).get("MailTemplate", [])
    return templates[0] if templates else None


def _already_reminded_enrollment_ids(client):
    """Enrollment ids that already received an INVITATION_EXPIRING_SOON mail."""
    query = """
    query RemindedInvitations {
        MailLog(where: {metadata: {_contains: {type: "INVITATION_EXPIRING_SOON"}}}) {
            metadata
        }
    }
    """
    result = client.send_query(query, {})
    reminded = set()
    if isinstance(result, dict) and not result.get("errors"):
        for row in result.get("data", {}).get("MailLog", []):
            meta = row.get("metadata") or {}
            enrollment_id = meta.get("enrollmentId")
            if isinstance(enrollment_id, int):
                reminded.add(enrollment_id)
    return reminded


def _format_date(iso_string):
    """Format a timestamptz ISO string as DD.MM.YYYY (best-effort)."""
    if not iso_string:
        return ""
    try:
        # Handle trailing Z and offsets
        cleaned = iso_string.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned).strftime("%d.%m.%Y")
    except ValueError:
        return iso_string


def _queue_reminder_mail(client, template, enrollment):
    """Queue an INVITATION_EXPIRING_SOON mail with dedup metadata."""
    user = enrollment.get("User") or {}
    course = enrollment.get("Course") or {}
    to = user.get("email")
    if not to:
        return False

    frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"
    course_link = f"{frontend_url}/course/{course.get('id', '')}"
    variables = {
        "[User:FirstName]": _escape_html(user.get("firstName")),
        "[User:LastName]": _escape_html(user.get("lastName")),
        "[Enrollment:CourseId--Course:Name]": _escape_html(course.get("title")),
        "[Enrollment:ExpirationDate]": _format_date(enrollment.get("invitationExpirationDate")),
        "[Enrollment:CourseLink]": course_link,
    }

    subject = template["subject"]
    content = template["content"]
    for key, value in variables.items():
        subject = subject.replace(key, value)
        content = content.replace(key, value)

    mutation = """
    mutation QueueInvitationReminder(
        $subject: String!, $content: String!, $from: String!, $to: String!,
        $cc: String, $bcc: String, $metadata: jsonb
    ) {
        insert_MailLog_one(object: {
            subject: $subject, content: $content, from: $from, to: $to,
            cc: $cc, bcc: $bcc, status: "READY_TO_SEND", metadata: $metadata
        }) {
            id
        }
    }
    """
    result = client.send_query(mutation, {
        "subject": subject,
        "content": content,
        "from": template.get("from") or "noreply@opencampus.sh",
        "to": to,
        "cc": template.get("cc"),
        "bcc": template.get("bcc"),
        "metadata": {"type": "INVITATION_EXPIRING_SOON", "enrollmentId": enrollment["id"]},
    })
    if not isinstance(result, dict) or result.get("errors"):
        logging.error(f"Failed to queue invitation reminder to {to}: {result}")
        return False
    return True


def expire_invitations(arguments):
    """
    Handles course-invitation expiry:
      1. Sends an INVITATION_EXPIRING_SOON reminder ~24h before an invitation's
         invitationExpirationDate (deduped via MailLog metadata).
      2. Flips lapsed INVITED enrollments (past their invitationExpirationDate)
         to EXPIRED. The send_enrollment_status_email event trigger then sends
         the INVITATION_EXPIRED mail.

    Note on the set_invitation_expiration_date DB trigger: it resets
    invitationExpirationDate to NOW() + 2 days on any update where the new
    status is INVITED. Flipping to EXPIRED (status != INVITED) does not retrigger
    it, so the date is preserved; re-inviting later (status -> INVITED) correctly
    resets the 2-day window.

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: { success, data: { remindedCount, expiredCount } } or { success, error }
    """
    logging.info("########## Expire Invitations Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        client = EduHubClient()
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        reminder_cutoff_iso = (now + timedelta(hours=REMINDER_LEAD_HOURS)).isoformat()

        # 1. Reminders for invitations expiring within the lead window (not yet lapsed).
        reminded_ids = _already_reminded_enrollment_ids(client)
        reminder_query = """
        query ExpiringSoonInvitations($now: timestamptz!, $cutoff: timestamptz!) {
            CourseEnrollment(
                where: {
                    status: {_eq: INVITED},
                    invitationExpirationDate: {_gt: $now, _lte: $cutoff}
                }
            ) {
                id
                invitationExpirationDate
                User { email firstName lastName }
                Course { id title }
            }
        }
        """
        reminder_result = client.send_query(
            reminder_query, {"now": now_iso, "cutoff": reminder_cutoff_iso}
        )
        if not isinstance(reminder_result, dict) or reminder_result.get("errors"):
            logging.error(f"Failed to query expiring invitations: {reminder_result}")
            return {"success": False, "error": str(reminder_result)}

        expiring_soon = reminder_result["data"]["CourseEnrollment"]
        template = _get_default_mail_template(client, "INVITATION_EXPIRING_SOON")
        reminded = 0
        if template:
            for enrollment in expiring_soon:
                if enrollment["id"] in reminded_ids:
                    continue
                if _queue_reminder_mail(client, template, enrollment):
                    reminded += 1
        else:
            logging.warning("INVITATION_EXPIRING_SOON template missing; skipping reminders")

        # 2. Flip lapsed INVITED invitations to EXPIRED. The event trigger sends
        # INVITATION_EXPIRED. status is a Hasura enum -> use enum literals.
        expire_mutation = """
        mutation ExpireInvitations($now: timestamptz!) {
            update_CourseEnrollment(
                where: {status: {_eq: INVITED}, invitationExpirationDate: {_lte: $now}},
                _set: {status: EXPIRED}
            ) {
                affected_rows
            }
        }
        """
        expire_result = client.send_query(expire_mutation, {"now": now_iso})
        if not isinstance(expire_result, dict) or expire_result.get("errors"):
            logging.error(f"Failed to expire invitations: {expire_result}")
            return {"success": False, "error": str(expire_result)}

        expired_count = expire_result["data"]["update_CourseEnrollment"]["affected_rows"]
        logging.info(f"Reminded {reminded} invitation(s); expired {expired_count} invitation(s)")

        return {
            "success": True,
            "data": {"remindedCount": reminded, "expiredCount": expired_count},
        }

    except Exception as e:
        logging.exception("expire_invitations failed")
        return {"success": False, "error": str(e)}
