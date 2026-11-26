import calendar
import logging
from datetime import datetime, timezone
from api_clients import EduHubClient, HasuraQueryError

# Who sent a bug report or feature idea, or joined one, is kept until 6 months after the report
# was closed (DONE, DECLINED or DUPLICATE), for follow-up questions (issue #2234).
RETENTION_MONTHS = 6


def months_before(moment, months):
    """The same day and time `months` calendar months earlier; the month's last day if it is shorter."""
    month_index = moment.year * 12 + moment.month - 1 - months
    year, month = divmod(month_index, 12)
    day = min(moment.day, calendar.monthrange(year, month + 1)[1])
    return moment.replace(year=year, month=month + 1, day=day)


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
    cutoff = months_before(datetime.now(timezone.utc), RETENTION_MONTHS).isoformat()
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
