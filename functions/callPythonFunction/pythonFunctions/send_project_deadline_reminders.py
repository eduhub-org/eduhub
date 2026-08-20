import logging
import os
from datetime import datetime, timedelta, timezone

from api_clients import EduHubClient

from pythonFunctions.mail_helpers import (
    already_sent_keys,
    get_default_mail_template,
    queue_mail,
)

# How long before the submission deadline the reminder goes out.
REMINDER_LEAD_HOURS = 48

MAIL_TYPE = "PROJECT_DEADLINE_REMINDER"


def send_project_deadline_reminders(arguments):
    """
    Reminds accepted project authors of ONGOING projects whose submissionDeadline
    falls within the next REMINDER_LEAD_HOURS. Deduped per (projectId, userId) via
    MailLog metadata so each author is reminded only once per project.

    Returns:
        dict: { success, data: { remindedCount } } or { success, error }
    """
    logging.info("########## Send Project Deadline Reminders ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        client = EduHubClient()
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        cutoff_iso = (now + timedelta(hours=REMINDER_LEAD_HOURS)).isoformat()
        frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"

        query = """
        query ProjectsWithApproachingDeadline($now: timestamptz!, $cutoff: timestamptz!) {
            Project(
                where: {
                    status: {_eq: ONGOING},
                    submissionDeadline: {_gt: $now, _lte: $cutoff}
                }
            ) {
                id
                title
                submissionDeadline
                ProjectAuthors(where: {participationStatus: {_eq: ACCEPTED}}) {
                    User { id email firstName lastName }
                }
            }
        }
        """
        result = client.send_query(query, {"now": now_iso, "cutoff": cutoff_iso})
        if not isinstance(result, dict) or result.get("errors"):
            logging.error(f"Failed to query projects with approaching deadline: {result}")
            return {"success": False, "error": str(result)}

        projects = result["data"]["Project"]
        template = get_default_mail_template(client, MAIL_TYPE)
        if not template:
            logging.warning(f"{MAIL_TYPE} template missing; skipping")
            return {"success": True, "data": {"remindedCount": 0}}

        candidates = []
        for project in projects:
            for author in project.get("ProjectAuthors", []):
                user = author.get("User") or {}
                if not user.get("id") or not user.get("email"):
                    continue
                candidates.append(
                    {
                        "projectId": project["id"],
                        "userId": user["id"],
                        "submissionDeadline": project.get("submissionDeadline"),
                        "project": project,
                        "user": user,
                    }
                )

        # The deadline is part of the key: extending it opens a new reminder
        # window, which must not be suppressed by the previous window's mail.
        key_fields = ["projectId", "userId", "submissionDeadline"]
        reminded_keys = already_sent_keys(client, MAIL_TYPE, candidates, key_fields)

        reminded = 0
        for candidate in candidates:
            if (
                candidate["projectId"],
                candidate["userId"],
                candidate["submissionDeadline"],
            ) in reminded_keys:
                continue
            project = candidate["project"]
            user = candidate["user"]
            queued = queue_mail(
                client,
                template,
                user.get("email"),
                {
                    "[User:FirstName]": user.get("firstName"),
                    "[User:LastName]": user.get("lastName"),
                    "[Project:Title]": project.get("title"),
                    "[Project:Link]": f"{frontend_url}/project/{project.get('id', '')}",
                },
                metadata={
                    "type": MAIL_TYPE,
                    "projectId": candidate["projectId"],
                    "userId": candidate["userId"],
                    "submissionDeadline": candidate["submissionDeadline"],
                },
            )
            if queued:
                reminded += 1

        logging.info(f"Queued {reminded} project deadline reminder(s)")
        return {"success": True, "data": {"remindedCount": reminded}}

    except Exception as e:
        logging.exception("send_project_deadline_reminders failed")
        return {"success": False, "error": str(e)}
