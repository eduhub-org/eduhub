import hashlib
import hmac

from participant_data_handler import hash_user_id, process_participant_data, scope_enrollment_id

USER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def test_without_salt_keeps_the_legacy_id():
    # Funders that used the API before salting must keep matching their reports.
    expected = hashlib.sha256(USER.encode()).hexdigest()[:16]
    assert hash_user_id(USER) == f"urn:hash:{expected}"
    assert hash_user_id(USER, None) == hash_user_id(USER)


def test_an_empty_salt_is_a_salt_not_the_legacy_id():
    # Only NULL selects the legacy id; any stored text value is a salt.
    assert hash_user_id(USER, "") != hash_user_id(USER)


def test_with_salt_uses_hmac_and_is_stable():
    expected = hmac.new(b"funder-salt", USER.encode(), hashlib.sha256).hexdigest()[:16]
    assert hash_user_id(USER, "funder-salt") == f"urn:hash:{expected}"
    assert hash_user_id(USER, "funder-salt") == hash_user_id(USER, "funder-salt")


def test_ids_differ_between_funders_and_from_the_legacy_id():
    ids = {hash_user_id(USER), hash_user_id(USER, "salt-a"), hash_user_id(USER, "salt-b")}
    assert len(ids) == 3


def test_different_users_get_different_ids_under_one_salt():
    other = "cccccccc-cccc-cccc-cccc-cccccccccccc"
    assert hash_user_id(USER, "salt-a") != hash_user_id(other, "salt-a")


ENROLLMENT = {
    "id": 4711,
    "status": "CONFIRMED",
    "created_at": "2026-10-01T10:00:00Z",
    "achievementCertificateURL": "a.pdf",
    "attendanceCertificateURL": "b.pdf",
}
COURSE = {"title": "Machine Learning"}


def _report(salt):
    return process_participant_data(ENROLLMENT, {"id": USER}, None, COURSE, {"participant_id_salt": salt})


def test_report_of_a_salted_funder_uses_its_salt():
    report = _report("salt-a")
    assert report["id"] == hash_user_id(USER, "salt-a")
    ids = {a["id"] for a in report["learningAchievements"]}
    assert all(scope_enrollment_id(4711, "salt-a") in i for i in ids)
    assert not any(i.endswith(":4711") for i in ids)


def test_reports_of_two_salted_funders_share_no_identifier():
    a, b = _report("salt-a"), _report("salt-b")
    ids_a = {a["id"], *(x["id"] for x in a["learningAchievements"])}
    ids_b = {b["id"], *(x["id"] for x in b["learningAchievements"])}
    assert not ids_a & ids_b


def test_report_of_a_legacy_funder_is_unchanged():
    report = _report(None)
    assert report["id"] == f"urn:hash:{hashlib.sha256(USER.encode()).hexdigest()[:16]}"
    assert {a["id"] for a in report["learningAchievements"]} == {
        "urn:achievement:attendance:4711",
        "urn:achievement:completion:4711",
    }
