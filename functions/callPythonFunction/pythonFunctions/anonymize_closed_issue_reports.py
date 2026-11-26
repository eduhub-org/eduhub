import logging
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient, HasuraQueryError

# Who sent a bug report or feature idea, or joined one, is kept until 6 months after the report
# was closed (DONE, DECLINED or DUPLICATE), for follow-up questions (issue #2234).
RETENTION_DAYS = 183


def anonymize_closed_issue_reports(arguments):
    """
    Removes the userId from IssueReport rows closed more than 6 months ago and from their
    IssueReportVote rows. Runs daily via the anonymize_closed_issue_reports cron trigger. Logs
    only the number of rows, never their content.

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: {"success": True, "data": {"reports": n, "votes": m}} or {"success": False, "error": ...}
    """
    logging.info("########## Anonymize Closed Issue Reports Function ##########")
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    mutation = """
    mutation AnonymizeClosedIssueReports($cutoff: timestamptz!) {
        update_IssueReportVote(
            where: {userId: {_is_null: false}, IssueReport: {closedAt: {_lt: $cutoff}}}
            _set: {userId: null}
        ) {
            affected_rows
        }
        update_IssueReport(
            where: {userId: {_is_null: false}, closedAt: {_lt: $cutoff}}
            _set: {userId: null}
        ) {
            affected_rows
        }
    }
    """
    try:
        result = EduHubClient().send_query(mutation, {"cutoff": cutoff})
    except HasuraQueryError as error:
        logging.error(f"Anonymizing closed issue reports failed: {error}")
        return {"success": False, "error": str(error)}
    except Exception as error:  # noqa: BLE001 - the dispatcher expects a result dict
        logging.exception("anonymize_closed_issue_reports failed")
        return {"success": False, "error": str(error)}

    reports = result["data"]["update_IssueReport"]["affected_rows"]
    votes = result["data"]["update_IssueReportVote"]["affected_rows"]
    logging.info(f"Anonymized {reports} closed issue report(s) and {votes} vote(s)")
    return {"success": True, "data": {"reports": reports, "votes": votes}}
