"""Unit tests for the shared mail helpers used by the reminder cron jobs."""

from pythonFunctions.mail_helpers import (
    DEDUP_CHUNK_SIZE,
    already_sent_keys,
    escape_html,
    format_date,
    queue_mail,
)


class FakeClient:
    """Records the queries it is asked to run and replays canned responses."""

    def __init__(self, responses=None):
        self.calls = []
        self.responses = list(responses or [])

    def send_query(self, query, variables):
        self.calls.append({"query": query, "variables": variables})
        if self.responses:
            return self.responses.pop(0)
        return {"data": {"MailLog": []}}


TEMPLATE = {
    "subject": "Deadline - [Project:Title]",
    "content": "<p>Hi [User:FirstName], [Project:Title] is due.</p>",
    "from": "edu@opencampus.sh",
    "cc": None,
    "bcc": None,
}


class TestAlreadySentKeys:
    def test_no_candidates_makes_no_query(self):
        client = FakeClient()

        assert already_sent_keys(client, "PROJECT_DEADLINE_REMINDER", [], ["projectId"]) == set()
        assert client.calls == []

    def test_query_is_restricted_to_the_candidate_keys(self):
        client = FakeClient([
            {"data": {"MailLog": [{"metadata": {"type": "T", "projectId": 1, "userId": 7}}]}}
        ])
        candidates = [
            {"projectId": 1, "userId": 7},
            {"projectId": 2, "userId": 8},
        ]

        sent = already_sent_keys(client, "T", candidates, ["projectId", "userId"])

        # Only the candidate that already has a MailLog row is reported.
        assert sent == {(1, 7)}
        # One bounded query, with a clause per candidate rather than a full scan.
        assert len(client.calls) == 1
        clauses = client.calls[0]["variables"]["where"]["_or"]
        assert clauses == [
            {"metadata": {"_contains": {"type": "T", "projectId": 1, "userId": 7}}},
            {"metadata": {"_contains": {"type": "T", "projectId": 2, "userId": 8}}},
        ]

    def test_candidates_are_chunked(self):
        candidate_count = DEDUP_CHUNK_SIZE + 5
        candidates = [{"enrollmentId": i} for i in range(candidate_count)]
        client = FakeClient()

        already_sent_keys(client, "T", candidates, ["enrollmentId"])

        assert len(client.calls) == 2
        assert len(client.calls[0]["variables"]["where"]["_or"]) == DEDUP_CHUNK_SIZE
        assert len(client.calls[1]["variables"]["where"]["_or"]) == 5

    def test_failed_lookup_suppresses_the_chunk(self):
        # A failed dedup lookup must not turn into duplicate mails; the next
        # cron run retries these candidates.
        client = FakeClient([{"errors": [{"message": "boom"}]}])

        sent = already_sent_keys(client, "T", [{"enrollmentId": 3}], ["enrollmentId"])

        assert sent == {(3,)}


class TestQueueMail:
    def test_subject_is_plain_text_and_body_is_escaped(self):
        client = FakeClient([{"data": {"insert_MailLog_one": {"id": 1}}}])

        queued = queue_mail(
            client,
            TEMPLATE,
            "jane@example.com",
            {"[Project:Title]": "Solar & Co", "[User:FirstName]": "O'Brien"},
            metadata={"type": "PROJECT_DEADLINE_REMINDER", "projectId": 5},
        )

        assert queued is True
        variables = client.calls[0]["variables"]
        assert variables["subject"] == "Deadline - Solar & Co"
        assert variables["content"] == (
            "<p>Hi O&#x27;Brien, Solar &amp; Co is due.</p>"
        )
        assert variables["metadata"] == {"type": "PROJECT_DEADLINE_REMINDER", "projectId": 5}

    def test_missing_recipient_is_skipped(self):
        client = FakeClient()

        assert queue_mail(client, TEMPLATE, None, {}) is False
        assert client.calls == []

    def test_none_values_render_as_empty_string(self):
        client = FakeClient([{"data": {"insert_MailLog_one": {"id": 2}}}])

        queue_mail(client, TEMPLATE, "jane@example.com", {"[Project:Title]": None})

        assert client.calls[0]["variables"]["subject"] == "Deadline - "

    def test_graphql_error_is_reported_as_failure(self):
        client = FakeClient([{"errors": [{"message": "boom"}]}])

        assert queue_mail(client, TEMPLATE, "jane@example.com", {}) is False


class TestSmallHelpers:
    def test_escape_html_handles_empty_values(self):
        assert escape_html(None) == ""
        assert escape_html("") == ""

    def test_escape_html_escapes_quotes_and_angles(self):
        assert escape_html('<b>"x"</b>') == "&lt;b&gt;&quot;x&quot;&lt;/b&gt;"

    def test_format_date_accepts_z_suffix_and_offsets(self):
        assert format_date("2026-08-18T10:00:00Z") == "18.08.2026"
        assert format_date("2026-08-18T10:00:00+02:00") == "18.08.2026"

    def test_format_date_passes_through_unparsable_input(self):
        assert format_date("not a date") == "not a date"
        assert format_date(None) == ""
