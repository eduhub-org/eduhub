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

# Only invitations that lapsed within this many days are flipped to EXPIRED.
# Every flip sends an INVITATION_EXPIRED mail, and this job never ran
# successfully before the date/timestamptz fix, so without the bound its first
# run would mail everyone whose invitation lapsed at any time in the past. The
# window still covers a few missed runs. Older lapsed invitations stay INVITED;
# the applications table and statistics already treat them as expired by date.
EXPIRY_GRACE_DAYS = 3

MAIL_TYPE = "INVITATION_EXPIRING_SOON"


def expire_invitations(arguments):
    """
    Handles course-invitation expiry:
      1. Sends an INVITATION_EXPIRING_SOON reminder on the invitation's last
         day, i.e. when invitationExpirationDate is today (deduped via MailLog
         metadata).
      2. Flips lapsed INVITED enrollments (invitationExpirationDate before
         today, within EXPIRY_GRACE_DAYS) to EXPIRED. The
         send_enrollment_status_email event trigger then sends the
         INVITATION_EXPIRED mail.

    invitationExpirationDate is a Postgres date: the last day the invitation
    can be confirmed. The GraphQL variables must therefore be typed date, not
    timestamptz (Hasura rejects the latter), and "today" is the UTC date, so
    the job never expires an invitation before its last day has ended in
    Germany.

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
        today = datetime.now(timezone.utc).date()
        today_iso = today.isoformat()
        grace_start_iso = (today - timedelta(days=EXPIRY_GRACE_DAYS)).isoformat()
        frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"

        # 1. Reminders for invitations whose last day is today (not yet lapsed).
        reminder_query = """
        query ExpiringSoonInvitations($today: date!) {
            CourseEnrollment(
                where: {
                    status: {_eq: INVITED},
                    invitationExpirationDate: {_eq: $today}
                }
            ) {
                id
                invitationExpirationDate
                User { email firstName lastName }
                Course { id title }
            }
        }
        """
        reminder_result = client.send_query(reminder_query, {"today": today_iso})
        if not isinstance(reminder_result, dict) or reminder_result.get("errors"):
            logging.error(f"Failed to query expiring invitations: {reminder_result}")
            return {"success": False, "error": str(reminder_result)}

        expiring_soon = reminder_result["data"]["CourseEnrollment"]
        template = get_default_mail_template(client, MAIL_TYPE)
        reminded = 0
        if template:
            # The expiry date is part of the key: re-inviting someone moves the
            # date and must produce a fresh reminder rather than matching the
            # MailLog row of the previous invitation window.
            candidates = [
                {
                    "enrollmentId": enrollment["id"],
                    "invitationExpirationDate": enrollment.get("invitationExpirationDate"),
                    "enrollment": enrollment,
                }
                for enrollment in expiring_soon
                if (enrollment.get("User") or {}).get("email")
            ]
            key_fields = ["enrollmentId", "invitationExpirationDate"]
            reminded_keys = already_sent_keys(client, MAIL_TYPE, candidates, key_fields)

            for candidate in candidates:
                if (
                    candidate["enrollmentId"],
                    candidate["invitationExpirationDate"],
                ) in reminded_keys:
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
                    metadata={
                        "type": MAIL_TYPE,
                        "enrollmentId": candidate["enrollmentId"],
                        "invitationExpirationDate": candidate["invitationExpirationDate"],
                    },
                )
                if queued:
                    reminded += 1
        else:
            logging.warning(f"{MAIL_TYPE} template missing; skipping reminders")

        # 2. Flip lapsed INVITED invitations to EXPIRED. The event trigger sends
        # INVITATION_EXPIRED. status is a Hasura enum -> use enum literals.
        expire_mutation = """
        mutation ExpireInvitations($today: date!, $graceStart: date!) {
            update_CourseEnrollment(
                where: {
                    status: {_eq: INVITED},
                    invitationExpirationDate: {_lt: $today, _gte: $graceStart}
                },
                _set: {status: EXPIRED}
            ) {
                affected_rows
            }
        }
        """
        expire_result = client.send_query(
            expire_mutation, {"today": today_iso, "graceStart": grace_start_iso}
        )
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
