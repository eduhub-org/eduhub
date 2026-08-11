"""Unit tests for EduHubClient.fetch_degree_participations.

The generic `send_query` helper returns a string on a non-200 response and
ignores the GraphQL `errors` key. For degree certificates that leniency would
silently produce an empty component list on a legal document, so this query uses
the strict `_post_graphql` path instead - these tests pin that behaviour.
"""
import json

import pytest
import requests

from api_clients import eduhub_client as eduhub_client_module
from api_clients.eduhub_client import EduHubClient


class _FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = json.dumps(payload)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.exceptions.HTTPError(f"HTTP {self.status_code}")

    def json(self):
        return self._payload


def _client():
    client = EduHubClient.__new__(EduHubClient)
    client.url = "http://hasura/v1/graphql"
    client.hasura_admin_secret = "secret"
    return client


def _row(user_id, course_id, title, ects, program_type="COURSES", certificate_url="a.pdf",
         program_short_title="24W"):
    return {
        "userId": user_id,
        "achievementCertificateURL": certificate_url,
        "Course": {
            "id": course_id,
            "title": title,
            "ects": ects,
            "Program": {
                "title": "Winter 2024",
                "type": program_type,
                "shortTitle": program_short_title,
            },
        },
    }


@pytest.fixture
def post(monkeypatch):
    """Captures the outgoing request and replays a canned response."""
    calls = []

    def _install(payload, status_code=200):
        def fake_post(url, headers=None, json=None, **kwargs):
            calls.append({"url": url, "headers": headers, "json": json})
            return _FakeResponse(payload, status_code)

        monkeypatch.setattr(eduhub_client_module.requests, "post", fake_post)
        return calls

    return _install


class TestFetchDegreeParticipations:
    def test_groups_rows_per_user(self, post):
        post(
            {
                "data": {
                    "CourseEnrollment": [
                        _row("u1", 1, "Intro to ML", "5"),
                        _row("u1", 9, "Coding.Waterkant", "NONE", program_type="EVENTS",
                             certificate_url=None, program_short_title="EVENTS"),
                        _row("u2", 1, "Intro to ML", "5"),
                    ]
                }
            }
        )
        result = _client().fetch_degree_participations(["u1", "u2", "u3"], 158)

        assert sorted(result) == ["u1", "u2"], "users without rows stay absent"
        assert len(result["u1"]) == 2
        assert result["u1"][0] == {
            "courseId": 1,
            "title": "Intro to ML",
            "ects": "5",
            "programTitle": "Winter 2024",
            "programType": "COURSES",
            "programShortTitle": "24W",
            "hasAchievementCertificate": True,
        }
        assert result["u1"][1]["hasAchievementCertificate"] is False
        assert result["u1"][1]["programType"] == "EVENTS"

    def test_sends_variables_and_admin_secret(self, post):
        calls = post({"data": {"CourseEnrollment": []}})
        _client().fetch_degree_participations(["u1"], 158)

        assert calls[0]["json"]["variables"] == {"userIds": ["u1"], "degreeCourseId": 158}
        assert calls[0]["headers"]["x-hasura-admin-secret"] == "secret"

    def test_graphql_errors_raise(self, post):
        post({"errors": [{"message": "field 'requiredEcts' not found"}]})
        with pytest.raises(ValueError):
            _client().fetch_degree_participations(["u1"], 158)

    def test_http_error_raises(self, post):
        post({"data": None}, status_code=500)
        with pytest.raises(requests.exceptions.HTTPError):
            _client().fetch_degree_participations(["u1"], 158)

    def test_missing_collection_raises(self, post):
        post({"data": {}})
        with pytest.raises(ValueError):
            _client().fetch_degree_participations(["u1"], 158)

    def test_no_matching_enrollments_yields_empty_dict(self, post):
        post({"data": {"CourseEnrollment": []}})
        assert _client().fetch_degree_participations(["u1"], 158) == {}
