"""Unit tests for the 30-day deletion of Assistant feedback (issue #2193)."""
from datetime import datetime, timedelta, timezone

from pythonFunctions import delete_expired_assistant_feedback as mod
from api_clients import HasuraQueryError


class FakeClient:
    def __init__(self, error=None):
        self.calls = []
        self.error = error

    def send_query(self, query, variables):
        self.calls.append({"query": query, "variables": variables})
        if self.error:
            raise self.error
        return {"data": {"delete_AssistantFeedback": {"affected_rows": 3}}}


def test_deletes_rows_older_than_30_days(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr(mod, "EduHubClient", lambda: client)

    result = mod.delete_expired_assistant_feedback({})

    assert result == {"success": True, "data": {"deletedCount": 3}}
    assert "delete_AssistantFeedback" in client.calls[0]["query"]
    cutoff = datetime.fromisoformat(client.calls[0]["variables"]["cutoff"])
    expected = datetime.now(timezone.utc) - timedelta(days=30)
    assert abs((cutoff - expected).total_seconds()) < 60


def test_reports_hasura_errors(monkeypatch):
    monkeypatch.setattr(mod, "EduHubClient", lambda: FakeClient(HasuraQueryError("boom")))

    result = mod.delete_expired_assistant_feedback({})

    assert result["success"] is False


def test_is_registered_in_dispatcher():
    import main

    assert main.PYTHON_FUNCTIONS["delete_expired_assistant_feedback"] is mod.delete_expired_assistant_feedback
