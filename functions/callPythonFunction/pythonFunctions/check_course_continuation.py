import logging
import os
from api_clients import EduHubClient


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
    query GetContinuationMailTemplate($type: MailTemplateType_enum!) {
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


def _already_notified_keys(client):
    """(courseId, userId) pairs already sent a continuation inquiry."""
    query = """
    query NotifiedContinuation {
        MailLog(where: {metadata: {_contains: {type: "COURSE_CONTINUATION_INQUIRY"}}}) {
            metadata
        }
    }
    """
    result = client.send_query(query, {})
    notified = set()
    if isinstance(result, dict) and not result.get("errors"):
        for row in result.get("data", {}).get("MailLog", []):
            meta = row.get("metadata") or {}
            course_id = meta.get("courseId")
            user_id = meta.get("userId")
            if course_id is not None and user_id is not None:
                notified.add((course_id, user_id))
    return notified


def _queue_inquiry(client, template, course, user):
    to = user.get("email")
    if not to:
        return False
    frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"
    variables = {
        "[User:FirstName]": _escape_html(user.get("firstName")),
        "[User:LastName]": _escape_html(user.get("lastName")),
        "[Enrollment:CourseId--Course:Name]": _escape_html(course.get("title")),
        "[Enrollment:CourseLink]": f"{frontend_url}/course/{course.get('id', '')}",
    }
    subject = template["subject"]
    content = template["content"]
    for key, value in variables.items():
        subject = subject.replace(key, value)
        content = content.replace(key, value)

    mutation = """
    mutation QueueContinuationInquiry(
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
        "metadata": {"type": "COURSE_CONTINUATION_INQUIRY", "courseId": course["id"], "userId": user.get("id")},
    })
    if not isinstance(result, dict) or result.get("errors"):
        logging.error(f"Failed to queue continuation inquiry to {to}: {result}")
        return False
    return True


def check_course_continuation(arguments):
    """
    For courses with a maxMissedSessions limit, finds active (CONFIRMED/REGISTERED)
    enrollees whose number of MISSED sessions has *exceeded* that limit and asks them
    (once, deduped via MailLog metadata) whether they intend to continue the course.

    Returns:
        dict: { success, data: { notifiedCount } } or { success, error }
    """
    logging.info("########## Check Course Continuation Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        client = EduHubClient()

        query = """
        query CoursesWithMissedLimit {
            Course(where: {maxMissedSessions: {_is_null: false}}) {
                id
                title
                maxMissedSessions
                CourseEnrollments(where: {status: {_in: [CONFIRMED, REGISTERED]}}) {
                    User { id email firstName lastName }
                }
                Sessions {
                    Attendances(where: {status: {_eq: MISSED}}) {
                        userId
                    }
                }
            }
        }
        """
        result = client.send_query(query, {})
        if not isinstance(result, dict) or result.get("errors"):
            logging.error(f"Failed to query courses for continuation check: {result}")
            return {"success": False, "error": str(result)}

        courses = result["data"]["Course"]
        template = _get_default_mail_template(client, "COURSE_CONTINUATION_INQUIRY")
        if not template:
            logging.warning("COURSE_CONTINUATION_INQUIRY template missing; skipping")
            return {"success": True, "data": {"notifiedCount": 0}}

        notified_keys = _already_notified_keys(client)
        notified = 0

        for course in courses:
            max_missed = course.get("maxMissedSessions")
            if max_missed is None:
                continue

            # Count MISSED attendances per user across all sessions of the course.
            missed_by_user = {}
            for session in course.get("Sessions", []):
                for att in session.get("Attendances", []):
                    uid = att.get("userId")
                    if uid is not None:
                        missed_by_user[uid] = missed_by_user.get(uid, 0) + 1

            for enrollment in course.get("CourseEnrollments", []):
                user = enrollment.get("User") or {}
                uid = user.get("id")
                if not uid or not user.get("email"):
                    continue
                if missed_by_user.get(uid, 0) <= max_missed:
                    continue  # only when the limit is EXCEEDED
                if (course["id"], uid) in notified_keys:
                    continue
                if _queue_inquiry(client, template, course, user):
                    notified += 1

        logging.info(f"Queued {notified} course-continuation inquiry email(s)")
        return {"success": True, "data": {"notifiedCount": notified}}

    except Exception as e:
        logging.exception("check_course_continuation failed")
        return {"success": False, "error": str(e)}
