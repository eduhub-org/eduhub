import logging
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient, HasuraQueryError

# Conversations rated thumbs-down in the Assistant are kept for 30 days (issue #2193, ADR 0005).
RETENTION_DAYS = 30


def delete_expired_assistant_feedback(arguments):
    """
    Deletes AssistantFeedback rows older than 30 days. Runs daily via the
    delete_expired_assistant_feedback cron trigger. Logs only the number of rows,
    never their content.

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: {"success": True, "data": {"deletedCount": n}} or {"success": False, "error": ...}
    """
    logging.info("########## Delete Expired Assistant Feedback Function ##########")
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    mutation = """
    mutation DeleteExpiredAssistantFeedback($cutoff: timestamptz!) {
        delete_AssistantFeedback(where: {created_at: {_lt: $cutoff}}) {
            affected_rows
        }
    }
    """
    try:
        result = EduHubClient().send_query(mutation, {"cutoff": cutoff})
    except HasuraQueryError as error:
        logging.error(f"Deleting expired assistant feedback failed: {error}")
        return {"success": False, "error": str(error)}
    except Exception as error:  # noqa: BLE001 - the dispatcher expects a result dict
        logging.exception("delete_expired_assistant_feedback failed")
        return {"success": False, "error": str(error)}

    deleted = result["data"]["delete_AssistantFeedback"]["affected_rows"]
    logging.info(f"Deleted {deleted} expired assistant feedback row(s)")
    return {"success": True, "data": {"deletedCount": deleted}}
