import logging
import os
from datetime import datetime, timedelta, timezone

from api_clients import EduHubClient

from pythonFunctions.mail_helpers import (
    already_sent_keys,
    format_date,
    get_default_mail_template,
    queue_mail,
)

# How long before an invitation expires we send the "expiring soon" reminder.
REMINDER_LEAD_HOURS = 24

MAIL_TYPE = "INVITATION_EXPIRING_SOON"


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
        frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"

        # 1. Reminders for invitations expiring within the lead window (not yet lapsed).
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
        template = get_default_mail_template(client, MAIL_TYPE)
        reminded = 0
        if template:
            candidates = [
                {"enrollmentId": enrollment["id"], "enrollment": enrollment}
                for enrollment in expiring_soon
                if (enrollment.get("User") or {}).get("email")
            ]
            key_fields = ["enrollmentId"]
            reminded_keys = already_sent_keys(client, MAIL_TYPE, candidates, key_fields)

            for candidate in candidates:
                if (candidate["enrollmentId"],) in reminded_keys:
                    continue
                enrollment = candidate["enrollment"]
                user = enrollment.get("User") or {}
                course = enrollment.get("Course") or {}
                queued = queue_mail(
                    client,
                    template,
                    user.get("email"),
                    {
                        "[User:FirstName]": user.get("firstName"),
                        "[User:LastName]": user.get("lastName"),
                        "[Enrollment:CourseId--Course:Name]": course.get("title"),
                        "[Enrollment:ExpirationDate]": format_date(
                            enrollment.get("invitationExpirationDate")
                        ),
                        "[Enrollment:CourseLink]": f"{frontend_url}/course/{course.get('id', '')}",
                    },
                    metadata={"type": MAIL_TYPE, "enrollmentId": candidate["enrollmentId"]},
                )
                if queued:
                    reminded += 1
        else:
            logging.warning(f"{MAIL_TYPE} template missing; skipping reminders")

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
