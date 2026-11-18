"""A failed Hasura query keeps the response it had when send_query still
returned an error string instead of raising HasuraQueryError."""

import pytest

import main
import participant_data_handler as handler
from api_clients.eduhub_client import HasuraQueryError

API_KEY = "edh_live_org160_sk_056afe290cadf18e2b2d7482c5f4e5a5"

HTTP_ERROR = HasuraQueryError("Something went wrong. HTTP Code: 500", status_code=500)
GRAPHQL_ERROR = HasuraQueryError(
    "GraphQL errors: boom", graphql_errors=[{"message": "boom"}], status_code=200
)
TRANSPORT_ERROR = HasuraQueryError("GraphQL request failed: timed out")


class FakeClient:
    """Raises the canned errors in order, then answers with `default`."""

    def __init__(self, *errors, default=None):
        self.errors = list(errors)
        self.default = default
        self.queries = []

    def send_query(self, query, variables):
        self.queries.append(query)
        if self.errors:
            raise self.errors.pop(0)
        return self.default


def test_moochub_maps_a_failed_query_to_500(monkeypatch):
    monkeypatch.setattr(main, "EduHubClient", lambda: FakeClient(HTTP_ERROR))

    assert main.handle_moochub_data() == (
        {"error": "Failed to fetch data from EduHub"},
        500,
    )


@pytest.mark.parametrize(
    "error, message",
    [
        (HTTP_ERROR, "Database connection error"),
        (GRAPHQL_ERROR, "Database query error"),
        (TRANSPORT_ERROR, "Authentication failed"),
    ],
)
def test_api_key_auth_keeps_its_error_messages(monkeypatch, error, message):
    monkeypatch.setattr(handler, "EduHubClient", lambda: FakeClient(error))

    with pytest.raises(ValueError) as excinfo:
        handler.authenticate_api_key(API_KEY)

    assert str(excinfo.value) == message


def test_funded_courses_fall_back_after_a_failed_primary_query():
    course = {"id": 7, "title": "Course", "CourseLocations": []}
    client = FakeClient(HTTP_ERROR, default={"data": {"Course": [course]}})

    courses = handler.get_organization_funded_courses(160, client)

    assert len(client.queries) == 2
    assert [entry["_internalId"] for entry in courses] == [7]


def test_funded_courses_are_empty_when_both_queries_fail():
    client = FakeClient(HTTP_ERROR, GRAPHQL_ERROR)

    assert handler.get_organization_funded_courses(160, client) == []


def test_funded_courses_propagate_a_transport_failure():
    with pytest.raises(HasuraQueryError):
        handler.get_organization_funded_courses(160, FakeClient(TRANSPORT_ERROR))
