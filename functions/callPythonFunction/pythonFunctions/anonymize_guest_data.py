import logging
import secrets
from datetime import datetime, timedelta, timezone

from api_clients import EduHubClient

# Kept in step with the Node-side erasure in
# functions/callNodeFunction/manageGuestRegistration/index.js and with the
# admin-triggered functions/callNodeFunction/anonymizeUser/index.js, so an
# anonymized row looks the same whichever path produced it.
ANON_NAME = "ANON_USER"

# How long an unconfirmed signup is kept before it is deleted outright. Mirrors
# CONFIRM_TOKEN_TTL_DAYS in functions/callNodeFunction/guestRegistration.js: once
# the link cannot be used, the address was never confirmed to be the registrant's
# and we have no basis to hold it at all.
UNCONFIRMED_GRACE_DAYS = 7

DEFAULT_RETENTION_MONTHS = 12


def _anonymized_email():
    return f"anon_{secrets.token_hex(6)}@example.com"


def _check(result, context):
    """Returns the data payload, or None after logging a GraphQL/transport error."""
    if not isinstance(result, dict):
        logging.error(f"{context}: unexpected response from Hasura: {result}")
        return None
    if result.get("errors"):
        logging.error(f"{context}: GraphQL errors: {result['errors']}")
        return None
    return result.get("data")


def _get_retention_months(client):
    query = """
    query GetGuestRetention {
        AppSettings(limit: 1) {
            guestDataRetentionMonths
        }
    }
    """
    data = _check(client.send_query(query, {}), "load retention setting")
    if not data:
        return DEFAULT_RETENTION_MONTHS
    settings = data.get("AppSettings") or []
    if not settings:
        return DEFAULT_RETENTION_MONTHS
    return settings[0].get("guestDataRetentionMonths") or DEFAULT_RETENTION_MONTHS


def _cutoff(retention_months):
    """
    Approximates months as 30 days. The retention period is a policy floor, not a
    deadline to hit exactly, and erring a day or two late never deletes something
    too early.
    """
    return datetime.now(timezone.utc) - timedelta(days=30 * int(retention_months))


# Guests whose every event finished before the cutoff. A guest with any event
# that ended later is left alone: the purpose the data was collected for has not
# finished.
#
# Two date sources, because there are two shapes of event:
#
#   Session.endDateTime    when the event has sessions -- the real thing.
#   Course.applicationEnd  when it has none. Not the end of the event but the
#                          registration deadline, so it runs slightly early. That
#                          is the safe direction to err for storage limitation,
#                          and it is NOT NULL, which means every guest can always
#                          be aged out. Retaining someone indefinitely because an
#                          organizer never entered session dates would defeat the
#                          retention period entirely.
#
# Note the two cutoffs are deliberately separate variables. Course.applicationEnd
# is a `date` and Session.endDateTime a `timestamptz`; Hasura types the
# comparison from the column and rejects the query outright if a timestamptz is
# used where a date is expected. That mismatch is what stopped this job running
# at all when it read Course.endTime -- a `time without time zone`, a wall-clock
# time of day with no year in it, which could never have answered "did this
# finish more than N months ago".
GUESTS_PAST_RETENTION = """
query GuestsPastRetention($cutoff: timestamptz!, $cutoffDate: date!) {
    User(
        where: {
            status: {_eq: GUEST}
            _not: {
                CourseEnrollments: {
                    _or: [
                        {Course: {Sessions: {endDateTime: {_gt: $cutoff}}}}
                        {_and: [
                            {_not: {Course: {Sessions: {}}}}
                            {Course: {applicationEnd: {_gt: $cutoffDate}}}
                        ]}
                    ]
                }
            }
            CourseEnrollments: {}
        }
        limit: 500
    ) {
        id
        OrganizationNewsletterSubscriptions(where: {status: {_neq: "UNSUBSCRIBED"}}) {
            organizationId
        }
    }
}
"""

# Signups that were never confirmed: a GUEST user with no enrollment at all,
# whose confirmation window has closed.
ABANDONED_GUESTS = """
query AbandonedGuests($cutoff: timestamptz!) {
    User(
        where: {
            status: {_eq: GUEST}
            _not: {CourseEnrollments: {}}
            created_at: {_lt: $cutoff}
        }
        limit: 500
    ) {
        id
    }
}
"""

UNSUBSCRIBE_NEWSLETTER = """
mutation UnsubscribeGuestNewsletter($userId: uuid!) {
    update_OrganizationNewsletterSubscription(
        where: {userId: {_eq: $userId}, status: {_neq: "UNSUBSCRIBED"}}
        _set: {status: "UNSUBSCRIBED", source: "ADMIN"}
    ) {
        affected_rows
    }
}
"""

ANONYMIZE_GUEST = """
mutation AnonymizeGuest($userId: uuid!, $email: String!, $anonName: String!) {
    update_User_by_pk(
        pk_columns: {id: $userId}
        _set: {
            firstName: $anonName
            lastName: $anonName
            email: $email
            picture: null
            externalProfile: null
            status: DELETED
        }
    ) {
        id
    }
}
"""

DELETE_TOKENS = """
mutation DeleteGuestTokens($userId: uuid!) {
    delete_GuestRegistrationToken(where: {userId: {_eq: $userId}}) {
        affected_rows
    }
}
"""

DELETE_GUEST_USER = """
mutation DeleteGuestUser($userId: uuid!) {
    delete_User_by_pk(id: $userId) {
        id
    }
}
"""


def _erase_guest(client, user_id, newsletter_subscriptions):
    """
    Anonymizes one guest in place.

    Order matters: syncGhostNewsletterSubscription re-reads User.email when it
    runs, so the unsubscribe has to be issued while the real address is still
    there. Anonymizing first would push the placeholder address to Ghost and
    leave the real one on the list.
    """
    if newsletter_subscriptions:
        if _check(
            client.send_query(UNSUBSCRIBE_NEWSLETTER, {"userId": user_id}),
            f"unsubscribe guest {user_id}",
        ) is None:
            # Anonymizing now would strand the address inside Ghost with no way
            # left to identify it. Skip; tomorrow's run retries.
            logging.error(f"Skipping erasure of guest {user_id}: newsletter unsubscribe failed")
            return False

    if _check(
        client.send_query(
            ANONYMIZE_GUEST,
            {"userId": user_id, "email": _anonymized_email(), "anonName": ANON_NAME},
        ),
        f"anonymize guest {user_id}",
    ) is None:
        return False

    _check(client.send_query(DELETE_TOKENS, {"userId": user_id}), f"delete tokens of {user_id}")
    return True


def anonymize_guest_data(arguments):
    """
    Enforces the guest data retention period (GDPR Art. 5(1)(e)).

    Runs daily via the anonymize_guest_data cron trigger and does two sweeps:

      1. Guests whose events all ended more than AppSettings
         .guestDataRetentionMonths ago are anonymized in place. The
         CourseEnrollment rows stay, so participant counts and reporting keep
         working, but they no longer point at an identifiable person. An event
         is dated by its last session, or by Course.applicationEnd when it has
         none -- that column is NOT NULL, so every guest can always be aged out.

      2. Signups that were never confirmed are deleted outright. Nothing
         references them, and an address whose owner never confirmed it is data
         we were never entitled to keep.

    Idempotent: an anonymized guest has status DELETED and so is not selected
    again on the next run.

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (dict, optional): Counts of anonymized and deleted guests
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Anonymize Guest Data Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        client = EduHubClient()

        retention_months = _get_retention_months(client)
        cutoff = _cutoff(retention_months)
        retention_cutoff = cutoff.isoformat()
        retention_cutoff_date = cutoff.date().isoformat()
        logging.info(
            f"Guest retention period is {retention_months} month(s); "
            f"anonymizing guests whose events ended before {retention_cutoff}"
        )

        anonymized = 0
        failed = 0

        data = _check(
            client.send_query(
                GUESTS_PAST_RETENTION,
                # Separate variables on purpose: Session.endDateTime is a
                # timestamptz and Course.applicationEnd a date, and Hasura types
                # each comparison from its column.
                {"cutoff": retention_cutoff, "cutoffDate": retention_cutoff_date},
            ),
            "select guests past retention",
        )
        if data is None:
            return {"success": False, "error": "Could not select guests past retention"}

        for guest in data.get("User", []):
            subscriptions = guest.get("OrganizationNewsletterSubscriptions") or []
            if _erase_guest(client, guest["id"], subscriptions):
                anonymized += 1
            else:
                failed += 1

        unconfirmed_cutoff = (
            datetime.now(timezone.utc) - timedelta(days=UNCONFIRMED_GRACE_DAYS)
        ).isoformat()

        deleted = 0
        data = _check(
            client.send_query(ABANDONED_GUESTS, {"cutoff": unconfirmed_cutoff}),
            "select abandoned guest signups",
        )
        if data is None:
            return {"success": False, "error": "Could not select abandoned guest signups"}

        for guest in data.get("User", []):
            # The GuestRegistrationToken FK cascades, so the tokens go with the row.
            if _check(
                client.send_query(DELETE_GUEST_USER, {"userId": guest["id"]}),
                f"delete abandoned guest {guest['id']}",
            ) is not None:
                deleted += 1

        logging.info(
            f"Guest retention run complete: {anonymized} anonymized, "
            f"{deleted} unconfirmed signups deleted, {failed} failed"
        )

        return {
            "success": True,
            "data": {
                "retentionMonths": retention_months,
                "anonymized": anonymized,
                "deletedUnconfirmed": deleted,
                "failed": failed,
            },
        }

    except Exception as error:
        logging.error(f"Error in anonymize_guest_data: {error}")
        return {"success": False, "error": str(error)}
