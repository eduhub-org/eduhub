import logging
import os
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient

# How far ahead of the submission deadline we send the reminder.
REMINDER_LEAD_HOURS = 48


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
    query = """
    query GetProjectMailTemplate($type: MailTemplateType_enum!) {
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


def _already_reminded_keys(client):
    """(projectId, userId) pairs already reminded, from MailLog metadata."""
    query = """
    query RemindedProjectDeadlines {
        MailLog(where: {metadata: {_contains: {type: "PROJECT_DEADLINE_REMINDER"}}}) {
            metadata
        }
    }
    """
    result = client.send_query(query, {})
    reminded = set()
    if isinstance(result, dict) and not result.get("errors"):
        for row in result.get("data", {}).get("MailLog", []):
            meta = row.get("metadata") or {}
            project_id = meta.get("projectId")
            user_id = meta.get("userId")
            if project_id is not None and user_id is not None:
                reminded.add((project_id, user_id))
    return reminded


def _queue_reminder(client, template, project, user):
    to = user.get("email")
    if not to:
        return False
    frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"
    variables = {
        "[User:FirstName]": _escape_html(user.get("firstName")),
        "[User:LastName]": _escape_html(user.get("lastName")),
        "[Project:Title]": _escape_html(project.get("title")),
        "[Project:Link]": f"{frontend_url}/project/{project.get('id', '')}",
    }
    subject = template["subject"]
    content = template["content"]
    for key, value in variables.items():
        subject = subject.replace(key, value)
        content = content.replace(key, value)

    mutation = """
    mutation QueueProjectDeadlineReminder(
        $subject: String!, $content: String!, $from: String!, $to: String!,
        $cc: String, $bcc: String, $metadata: jsonb
    ) {
        insert_MailLog_one(object: {
            subject: $subject, content: $content, from: $from, to: $to,
            cc: $cc, bcc: $bcc, status: "READY_TO_SEND", metadata: $metadata
        }) { id }
    }
    """
    result = client.send_query(mutation, {
        "subject": subject,
        "content": content,
        "from": template.get("from") or "noreply@opencampus.sh",
        "to": to,
        "cc": template.get("cc"),
        "bcc": template.get("bcc"),
        "metadata": {"type": "PROJECT_DEADLINE_REMINDER", "projectId": project["id"], "userId": user.get("id")},
    })
    if not isinstance(result, dict) or result.get("errors"):
        logging.error(f"Failed to queue project deadline reminder to {to}: {result}")
        return False
    return True


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
        template = _get_default_mail_template(client, "PROJECT_DEADLINE_REMINDER")
        if not template:
            logging.warning("PROJECT_DEADLINE_REMINDER template missing; skipping")
            return {"success": True, "data": {"remindedCount": 0}}

        reminded_keys = _already_reminded_keys(client)
        reminded = 0
        for project in projects:
            for author in project.get("ProjectAuthors", []):
                user = author.get("User") or {}
                if not user.get("id"):
                    continue
                if (project["id"], user["id"]) in reminded_keys:
                    continue
                if _queue_reminder(client, template, project, user):
                    reminded += 1

        logging.info(f"Queued {reminded} project deadline reminder(s)")
        return {"success": True, "data": {"remindedCount": reminded}}

    except Exception as e:
        logging.exception("send_project_deadline_reminders failed")
        return {"success": False, "error": str(e)}
