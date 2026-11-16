"""A failed query for one guest must not stop the retention sweep."""

from api_clients import HasuraQueryError
from pythonFunctions import anonymize_guest_data as mod


def _error():
    return HasuraQueryError("Something went wrong. HTTP Code: 500", status_code=500)


class FakeClient:
    """Serves the two guest selections; fails the writes for `failing` ids."""

    def __init__(self, failing=()):
        self.failing = set(failing)
        self.calls = []

    def send_query(self, query, variables):
        self.calls.append((query, variables))
        if query is mod.GUESTS_PAST_RETENTION:
            return {"data": {"User": [{"id": "g1"}, {"id": "g2"}, {"id": "g3"}]}}
        if query is mod.ABANDONED_GUESTS:
            return {"data": {"User": [{"id": "a1"}, {"id": "a2"}]}}
        if variables.get("userId") in self.failing:
            raise _error()
        return {"data": {"AppSettings": []}}


def _run(monkeypatch, client):
    monkeypatch.setattr(mod, "EduHubClient", lambda: client)
    return mod.anonymize_guest_data({})


def test_a_failed_anonymization_does_not_stop_the_others(monkeypatch):
    client = FakeClient(failing={"g2"})

    result = _run(monkeypatch, client)

    assert result["success"] is True
    assert result["data"]["anonymized"] == 2
    assert result["data"]["failed"] == 1
    anonymized = [
        variables["userId"]
        for query, variables in client.calls
        if query is mod.ANONYMIZE_GUEST
    ]
    assert anonymized == ["g1", "g2", "g3"]


def test_a_failed_delete_does_not_stop_the_others(monkeypatch):
    client = FakeClient(failing={"a1"})

    result = _run(monkeypatch, client)

    assert result["success"] is True
    assert result["data"]["deletedUnconfirmed"] == 1


def test_a_failed_selection_fails_the_run(monkeypatch):
    class FailingSelection(FakeClient):
        def send_query(self, query, variables):
            if query is mod.GUESTS_PAST_RETENTION:
                raise _error()
            return super().send_query(query, variables)

    result = _run(monkeypatch, FailingSelection())

    assert result == {
        "success": False,
        "error": "Could not select guests past retention",
    }


def test_a_failed_retention_lookup_falls_back_to_the_default(monkeypatch):
    class FailingSettings(FakeClient):
        def send_query(self, query, variables):
            if "AppSettings" in query:
                raise _error()
            return super().send_query(query, variables)

    result = _run(monkeypatch, FailingSettings())

    assert result["data"]["retentionMonths"] == mod.DEFAULT_RETENTION_MONTHS
