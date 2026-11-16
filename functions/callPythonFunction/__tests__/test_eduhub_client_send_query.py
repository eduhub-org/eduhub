"""Unit tests for EduHubClient.send_query request hygiene and failures."""
import logging

import pytest
import requests

from api_clients import eduhub_client as eduhub_client_module
from api_clients.eduhub_client import EduHubClient, HasuraQueryError

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


class _Response:
    def __init__(self, status_code=200, payload=None, text="{}"):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


def _post_returning(monkeypatch, response):
    monkeypatch.setattr(
        eduhub_client_module.requests, "post", lambda url, **kw: response
    )


def test_send_query_returns_the_full_body_on_success(monkeypatch):
    body = {"data": {"User": [{"id": 1}]}}
    _post_returning(monkeypatch, _Response(payload=body))

    assert _client().send_query("query { x }", {}) == body


def test_send_query_raises_on_a_transport_error(monkeypatch):
    def fail(url, **kwargs):
        raise requests.exceptions.ConnectTimeout("timed out")

    monkeypatch.setattr(eduhub_client_module.requests, "post", fail)

    with pytest.raises(HasuraQueryError) as excinfo:
        _client().send_query("query { x }", {})

    assert excinfo.value.status_code is None
    assert excinfo.value.graphql_errors is None
    assert isinstance(excinfo.value.__cause__, requests.exceptions.ConnectTimeout)


def test_send_query_raises_on_a_non_200_response(monkeypatch):
    _post_returning(monkeypatch, _Response(status_code=500, text="oops"))

    with pytest.raises(HasuraQueryError) as excinfo:
        _client().send_query("query { x }", {})

    assert excinfo.value.status_code == 500
    assert excinfo.value.graphql_errors is None
    # The text callers used to get back as the return value.
    assert str(excinfo.value) == "Something went wrong. HTTP Code: 500"


def test_send_query_raises_on_a_non_json_body(monkeypatch):
    _post_returning(monkeypatch, _Response(payload=ValueError("not json")))

    with pytest.raises(HasuraQueryError) as excinfo:
        _client().send_query("query { x }", {})

    assert excinfo.value.status_code == 200


def test_send_query_raises_on_graphql_errors(monkeypatch):
    errors = [{"message": "field 'x' not found"}]
    _post_returning(monkeypatch, _Response(payload={"errors": errors}))

    with pytest.raises(HasuraQueryError) as excinfo:
        _client().send_query("query { x }", {})

    assert excinfo.value.graphql_errors == errors
    assert excinfo.value.status_code == 200
    assert "field 'x' not found" in str(excinfo.value)


def test_an_empty_errors_list_is_not_an_error(monkeypatch):
    body = {"data": {"x": 1}, "errors": []}
    _post_returning(monkeypatch, _Response(payload=body))

    assert _client().send_query("query { x }", {}) == body


def test_chat_link_lookup_still_maps_graphql_errors_to_none(monkeypatch):
    _post_returning(monkeypatch, _Response(payload={"errors": [{"message": "x"}]}))

    assert _client().get_channellinks_from_confirmed_users(7) is None


def test_chat_link_lookup_raises_on_an_http_error(monkeypatch):
    _post_returning(monkeypatch, _Response(status_code=502))

    with pytest.raises(HasuraQueryError):
        _client().get_channellinks_from_confirmed_users(7)
