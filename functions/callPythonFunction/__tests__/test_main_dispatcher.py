"""Request contract of the Python dispatcher: secret, routing, status codes.

See docs/SERVERLESS_FUNCTIONS.md, "Request contract".
"""
import json

import pytest
from flask import Flask, request

import main

SECRET = "test-cloud-function-secret"
app = Flask(__name__)


def _call(headers=None, data='{"action": {"name": "unknown_function"}}'):
    with app.test_request_context(
        "/", method="POST", data=data, headers=headers or {},
        content_type="application/json",
    ):
        response, status = main.call_python_function(request)
        return response.get_json(), status


@pytest.fixture(autouse=True)
def secret(monkeypatch):
    monkeypatch.setenv("HASURA_CLOUD_FUNCTION_SECRET", SECRET)


def test_missing_server_secret_is_a_server_error(monkeypatch):
    monkeypatch.delenv("HASURA_CLOUD_FUNCTION_SECRET")
    body, status = _call({"Hasura-Secret": SECRET})
    assert status == 500
    assert body["messageKey"] == "SERVER_MISCONFIGURED"


def test_missing_secret_header_is_unauthorized():
    body, status = _call()
    assert status == 401
    assert body == {"success": False, "error": "Missing Hasura secret", "messageKey": "MISSING_SECRET"}


@pytest.mark.parametrize("provided", ["wrong", "", "ä" + SECRET])
def test_wrong_secret_is_unauthorized(provided):
    body, status = _call({"Hasura-Secret": provided})
    assert status == 401
    assert body["messageKey"] == "INVALID_SECRET"


def test_unknown_function_is_not_found():
    body, status = _call({"Hasura-Secret": SECRET})
    assert status == 404
    assert body["messageKey"] == "FUNCTION_NOT_FOUND"


def test_missing_function_name_is_not_found():
    body, status = _call({"Hasura-Secret": SECRET}, data="{}")
    assert status == 404
    assert body["messageKey"] == "FUNCTION_NOT_FOUND"


@pytest.fixture
def handler(monkeypatch):
    calls = []

    def fake(arguments):
        calls.append(arguments)
        return fake.result

    fake.result = {"success": True}
    fake.calls = calls
    monkeypatch.setitem(main.PYTHON_FUNCTIONS, "fake_handler", fake)
    return fake


@pytest.mark.parametrize("headers", [
    {"Hasura-Secret": SECRET, "Function-Name": "fake_handler"},
    # Header names are case-insensitive.
    {"hasura-secret": SECRET, "function-name": "fake_handler"},
])
def test_routes_by_function_name_header(handler, headers):
    body, status = _call(headers, data="{}")
    assert status == 200
    assert body == {"success": True}
    assert len(handler.calls) == 1


def test_falls_back_to_the_action_name(handler):
    data = json.dumps({"action": {"name": "fake_handler"}, "input": {}})
    body, status = _call({"Hasura-Secret": SECRET}, data=data)
    assert status == 200
    assert len(handler.calls) == 1


def test_function_name_header_wins_over_action_name(handler):
    data = json.dumps({"action": {"name": "unknown_function"}})
    _, status = _call({"Hasura-Secret": SECRET, "Function-Name": "fake_handler"}, data=data)
    assert status == 200
    assert len(handler.calls) == 1


def test_wraps_a_plain_result(handler):
    handler.result = [1, 2]
    body, status = _call({"Hasura-Secret": SECRET, "Function-Name": "fake_handler"}, data="{}")
    assert status == 200
    assert body == {"success": True, "result": [1, 2]}


RETRYABLE = {"success": False, "retryable": True, "error": "mailgun down"}
HEADERS = {"Hasura-Secret": SECRET, "Function-Name": "fake_handler"}


@pytest.mark.parametrize("payload", [
    {"event": {"op": "INSERT", "data": {"new": {}}}},
    {"scheduled_time": "2026-11-04T10:00:00Z", "payload": {}},
])
def test_retryable_trigger_failure_is_unavailable(handler, payload):
    handler.result = RETRYABLE
    body, status = _call(HEADERS, data=json.dumps(payload))
    assert status == 503
    assert body == RETRYABLE


def test_retryable_failure_of_an_action_is_ok(handler):
    handler.result = RETRYABLE
    _, status = _call(HEADERS, data=json.dumps({"action": {"name": "x"}, "input": {}}))
    assert status == 200


def test_failure_that_is_not_retryable_is_ok(handler):
    handler.result = {"success": False, "error": "no address"}
    _, status = _call(HEADERS, data=json.dumps({"event": {"op": "INSERT"}}))
    assert status == 200


def test_handler_exception_is_reported_with_200(handler, monkeypatch):
    def boom(arguments):
        raise RuntimeError("boom")

    monkeypatch.setitem(main.PYTHON_FUNCTIONS, "fake_handler", boom)
    body, status = _call(HEADERS, data="{}")
    assert status == 200
    assert body == {"success": False, "error": "boom", "messageKey": "INTERNAL_SERVER_ERROR"}


def test_error_before_function_name_is_reported_not_raised():
    # get_json() fails before function_name is assigned; the except block
    # must still produce the error response instead of an UnboundLocalError.
    body, status = _call({"Hasura-Secret": SECRET}, data="{not json")
    assert status == 200
    assert body["success"] is False
    assert body["messageKey"] == "INTERNAL_SERVER_ERROR"
