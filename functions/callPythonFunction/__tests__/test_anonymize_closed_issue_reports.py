"""Unit tests for removing the user id from closed issue reports after 6 months (issue #2234)."""
from datetime import datetime, timezone

from pythonFunctions import anonymize_closed_issue_reports as mod
from api_clients import HasuraQueryError


class FakeClient:
    def __init__(self, error=None):
        self.calls = []
        self.error = error

    def send_query(self, query, variables):
        self.calls.append({"query": query, "variables": variables})
        if self.error:
            raise self.error
        return {"data": {"update_IssueReport": {"affected_rows": 2}, "update_IssueReportVote": {"affected_rows": 5}}}


def test_anonymizes_reports_closed_more_than_6_months_ago(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr(mod, "EduHubClient", lambda: client)

    result = mod.anonymize_closed_issue_reports({})

    assert result == {"success": True, "data": {"reports": 2, "votes": 5}}
    query = client.calls[0]["query"]
    assert "update_IssueReport(" in query and "update_IssueReportVote(" in query
    assert "closedAt: {_lt: $cutoff}" in query
    cutoff = datetime.fromisoformat(client.calls[0]["variables"]["cutoff"])
    expected = mod.months_before(datetime.now(timezone.utc), 6)
    assert abs((cutoff - expected).total_seconds()) < 60


def test_counts_calendar_months():
    at = datetime(2026, 8, 2, 3, 45, tzinfo=timezone.utc)
    assert mod.months_before(at, 6) == datetime(2026, 2, 2, 3, 45, tzinfo=timezone.utc)
    # A shorter month ends the period on its last day.
    assert mod.months_before(datetime(2026, 8, 31, tzinfo=timezone.utc), 6) == datetime(2026, 2, 28, tzinfo=timezone.utc)
    assert mod.months_before(datetime(2027, 3, 15, tzinfo=timezone.utc), 6) == datetime(2026, 9, 15, tzinfo=timezone.utc)


def test_reports_hasura_errors(monkeypatch):
    monkeypatch.setattr(mod, "EduHubClient", lambda: FakeClient(HasuraQueryError("boom")))

    assert mod.anonymize_closed_issue_reports({})["success"] is False


def test_is_registered_in_dispatcher():
    import main

    assert main.PYTHON_FUNCTIONS["anonymize_closed_issue_reports"] is mod.anonymize_closed_issue_reports
