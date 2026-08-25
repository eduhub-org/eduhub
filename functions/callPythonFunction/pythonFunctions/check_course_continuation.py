import logging
import os
from datetime import datetime, timezone

from api_clients import EduHubClient

from pythonFunctions.mail_helpers import (
    already_sent_keys,
    get_default_mail_template,
    queue_mail,
)

MAIL_TYPE = "COURSE_CONTINUATION_INQUIRY"


def check_course_continuation(arguments):
    """
    For running courses with a maxMissedSessions limit, finds active
    (CONFIRMED/REGISTERED) enrollees who have *reached* that limit and asks
    them (once, deduped via MailLog metadata) to attend the remaining
    sessions or to let us know if they no longer want to take part.

    The mail goes out as soon as the limit is reached - i.e. after the last
    absence that still allows a successful completion - so participants get
    a heads-up while they can still act on it, instead of only once the
    limit is already blown.

    Returns:
        dict: { success, data: { notifiedCount } } or { success, error }
    """
    logging.info("########## Check Course Continuation Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        client = EduHubClient()
        now_iso = datetime.now(timezone.utc).isoformat()
        frontend_url = os.environ.get("FRONTEND_URL") or "https://edu.opencampus.sh"

        # Only courses that are still running: asking someone whether they
        # intend to continue a finished course makes no sense, and it keeps the
        # attendance fan-out of this query bounded.
        query = """
        query CoursesWithMissedLimit($now: timestamptz!) {
            Course(where: {maxMissedSessions: {_is_null: false}, endTime: {_gte: $now}}) {
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
        result = client.send_query(query, {"now": now_iso})
        if not isinstance(result, dict) or result.get("errors"):
            logging.error(f"Failed to query courses for continuation check: {result}")
            return {"success": False, "error": str(result)}

        courses = result["data"]["Course"]
        template = get_default_mail_template(client, MAIL_TYPE)
        if not template:
            logging.warning(f"{MAIL_TYPE} template missing; skipping")
            return {"success": True, "data": {"notifiedCount": 0}}

        # Collect everyone at or over their course's limit first, so the dedup
        # lookup can be restricted to this run's candidates.
        candidates = []
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
                missed = missed_by_user.get(uid, 0)
                # Reaching the limit is the trigger, not exceeding it. A
                # course allowing 0 missed sessions still needs one actual
                # absence before there is anything to write about.
                if missed < max(max_missed, 1):
                    continue
                candidates.append({"courseId": course["id"], "userId": uid, "course": course, "user": user})

        key_fields = ["courseId", "userId"]
        notified_keys = already_sent_keys(client, MAIL_TYPE, candidates, key_fields)

        notified = 0
        for candidate in candidates:
            if (candidate["courseId"], candidate["userId"]) in notified_keys:
                continue
            course = candidate["course"]
            user = candidate["user"]
            queued = queue_mail(
                client,
                template,
                user.get("email"),
                {
                    "[User:FirstName]": user.get("firstName"),
                    "[User:LastName]": user.get("lastName"),
                    "[Enrollment:CourseId--Course:Name]": course.get("title"),
                    "[Enrollment:CourseLink]": f"{frontend_url}/course/{course.get('id', '')}",
                },
                metadata={
                    "type": MAIL_TYPE,
                    "courseId": candidate["courseId"],
                    "userId": candidate["userId"],
                },
            )
            if queued:
                notified += 1

        logging.info(f"Queued {notified} course-continuation inquiry email(s)")
        return {"success": True, "data": {"notifiedCount": notified}}

    except Exception as e:
        logging.exception("check_course_continuation failed")
        return {"success": False, "error": str(e)}
