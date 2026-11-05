import hashlib
import hmac

from participant_data_handler import hash_user_id

USER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def test_without_salt_keeps_the_legacy_id():
    # Funders that used the API before salting must keep matching their reports.
    expected = hashlib.sha256(USER.encode()).hexdigest()[:16]
    assert hash_user_id(USER) == f"urn:hash:{expected}"
    assert hash_user_id(USER, None) == hash_user_id(USER)
    assert hash_user_id(USER, "") == hash_user_id(USER)


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
