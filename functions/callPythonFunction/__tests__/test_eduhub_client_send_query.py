"""Unit tests for EduHubClient.send_query request hygiene."""
import logging

from api_clients import eduhub_client as eduhub_client_module
from api_clients.eduhub_client import EduHubClient

ADMIN_SECRET = "super-secret-admin-value"


class _FakeResponse:
    status_code = 200
    text = "{}"

    def json(self):
        return {"data": {}}


def _client():
    client = EduHubClient.__new__(EduHubClient)
    client.url = "http://hasura/v1/graphql"
    client.hasura_admin_secret = ADMIN_SECRET
    return client


def test_send_query_passes_a_timeout(monkeypatch):
    calls = []

    def fake_post(url, **kwargs):
        calls.append(kwargs)
        return _FakeResponse()

    monkeypatch.setattr(eduhub_client_module.requests, "post", fake_post)
    _client().send_query("query { x }", {"a": 1})
    assert calls[0]["timeout"] == eduhub_client_module.GRAPHQL_REQUEST_TIMEOUT_SECONDS


def test_send_query_never_logs_secret_or_variable_values(monkeypatch, caplog):
    monkeypatch.setattr(eduhub_client_module.requests, "post", lambda url, **kw: _FakeResponse())
    with caplog.at_level(logging.DEBUG):
        _client().send_query("query { x }", {"email": "person@example.org"})
    assert ADMIN_SECRET not in caplog.text
    assert "person@example.org" not in caplog.text
    assert "email" in caplog.text
