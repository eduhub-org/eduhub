"""Unit tests for the secret check and error path of the Python dispatcher."""
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
    assert body["message"] == body["error"]
    assert body["extensions"] == {"code": "SERVER_MISCONFIGURED"}


def test_missing_secret_header_is_unauthorized():
    body, status = _call()
    assert status == 401
    assert body == {
        "success": False,
        "error": "Missing Hasura secret",
        "messageKey": "MISSING_SECRET",
        "message": "Missing Hasura secret",
        "extensions": {"code": "MISSING_SECRET"},
    }


@pytest.mark.parametrize("provided", ["wrong", "", "ä" + SECRET])
def test_wrong_secret_is_unauthorized(provided):
    body, status = _call({"Hasura-Secret": provided})
    assert status == 401
    assert body["messageKey"] == "INVALID_SECRET"
    assert body["message"] == "Invalid secret"
    assert body["extensions"] == {"code": "INVALID_SECRET"}


def test_valid_secret_reaches_the_function_lookup():
    body, status = _call({"Hasura-Secret": SECRET})
    assert status == 200
    assert body["messageKey"] == "FUNCTION_NOT_FOUND"


def test_error_before_function_name_is_reported_not_raised():
    # get_json() fails before function_name is assigned; the except block
    # must still produce the error response instead of an UnboundLocalError.
    body, status = _call({"Hasura-Secret": SECRET}, data="{not json")
    assert status == 200
    assert body["success"] is False
    assert body["messageKey"] == "INTERNAL_SERVER_ERROR"


def test_retryable_failure_carries_hasura_error_fields(monkeypatch):
    def failing(_arguments):
        return {"success": False, "error": "Try later", "messageKey": "BUSY", "retryable": True}

    monkeypatch.setitem(main.PYTHON_FUNCTIONS, "unknown_function", failing)
    body, status = _call({"Hasura-Secret": SECRET})
    assert status == 503
    assert body["error"] == "Try later"
    assert body["message"] == "Try later"
    assert body["extensions"] == {"code": "BUSY"}
