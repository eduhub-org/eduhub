"""Reads delivery outcomes back from Mailgun onto the MailLog rows that were sent.

Until now MailLog recorded only the *intent* to send: every queueing path writes
READY_TO_SEND and nothing ever wrote a later status, so a mail that hard-bounced
looked exactly like a mail that arrived. That is what allowed the StuJo cutover
announcement (scripts/stujo_cutover_employer_mail.sql) to keep sending through
1004 legacy employer addresses with nobody seeing the failure rate until the
whole batch was out.

Two things happen here, and the second is the one that matters operationally:

1. **Per-row bookkeeping.** Each Mailgun event carries ``v:maillogId``, so a
   delivered / bounced / complained event maps onto an exact MailLog row.
2. **A bounce-rate check.** If permanent failures exceed
   BOUNCE_RATE_THRESHOLD of the window's decided mail, this logs an error and
   mails the admin. Run hourly, that surfaces a bad recipient list after the
   first batch instead of after the last one.

Status transitions are monotonic -- COMPLAINED > BOUNCED > DELIVERED -- so
re-reading an overlapping window can never walk a row backwards, which is what
makes both the hourly overlap and a manual backfill safe to repeat.

Window: the run reads the trailing DEFAULT_LOOKBACK_HOURS rather than persisting
a cursor. The overlap is deliberate (an hourly cron reading 3h self-heals across
a couple of missed runs) and costs nothing because the updates are idempotent.
For a longer gap, or to backfill a batch sent before this function existed, pass
a payload:

    {"lookbackHours": 72}          # trailing 72 hours
    {"begin": "2026-09-05T00:00Z"} # explicit start
"""

import logging
import os
from datetime import datetime, timedelta, timezone

from api_clients import EduHubClient, MailgunClient
from api_clients.mailgun_client import maillog_id
from pythonFunctions.mail_helpers import already_sent_keys, queue_mail

STATUS_DELIVERED = "DELIVERED"
STATUS_BOUNCED = "BOUNCED"
STATUS_COMPLAINED = "COMPLAINED"

# Higher wins when one window holds several events for the same mail (a delivered
# mail can still be marked as spam afterwards), and a status is only written over
# a lower-ranked one. Anything not listed -- READY_TO_SEND, SENT, NULL -- ranks 0
# and is always safe to overwrite.
PRECEDENCE = {STATUS_DELIVERED: 1, STATUS_BOUNCED: 2, STATUS_COMPLAINED: 3}

DEFAULT_LOOKBACK_HOURS = 3
# Generous, but bounded: an unbounded `begin` would walk the whole event
# retention period and time the invocation out.
MAX_LOOKBACK_HOURS = 24 * 30

# Ids per update mutation. MailLog updates by primary key are cheap; this only
# keeps the generated document from growing without limit on a large backfill.
UPDATE_CHUNK_SIZE = 500

# Share of *decided* mail (delivered + permanently failed) that may bounce before
# this is treated as a broken recipient list rather than ordinary churn. Real
# lists sit well under 1%; the cutover batch was far above this.
BOUNCE_RATE_THRESHOLD = 0.05
# Below this, a rate is noise -- 1 bounce out of 3 mails is 33% and means nothing.
BOUNCE_RATE_MIN_SAMPLE = 20

ALERT_MAIL_TYPE = "MAIL_DELIVERY_BOUNCE_ALERT"


def classify_event(event):
    """Maps a Mailgun event to a MailLog status, or None to leave the row alone.

    A *temporary* failure is deliberately not a status: Mailgun is still
    retrying and will emit either a delivered or a permanent failed event for
    the same message later. Writing BOUNCED here would condemn mail that is
    about to arrive.
    """
    name = str(event.get("event") or "").lower()

    if name == "delivered":
        return STATUS_DELIVERED
    if name == "complained":
        return STATUS_COMPLAINED
    if name == "failed":
        severity = str(event.get("severity") or "").lower()
        if severity == "permanent":
            return STATUS_BOUNCED
        if severity == "temporary":
            return None
        # Undocumented severity: treat as unknown rather than as a bounce, and
        # say so, because silently dropping these would hide a Mailgun change.
        logging.warning("Mailgun 'failed' event with unexpected severity %r", event.get("severity"))
        return None
    return None


def resolve_begin(arguments):
    """Works out the start of the window to read, as (datetime, description)."""
    payload = arguments if isinstance(arguments, dict) else {}
    now = datetime.now(timezone.utc)

    explicit = payload.get("begin")
    if explicit:
        begin = datetime.fromisoformat(str(explicit).replace("Z", "+00:00"))
        if begin.tzinfo is None:
            begin = begin.replace(tzinfo=timezone.utc)
        earliest = now - timedelta(hours=MAX_LOOKBACK_HOURS)
        if begin < earliest:
            logging.warning(
                "Requested begin %s is older than the %d hour cap; clamping",
                begin.isoformat(),
                MAX_LOOKBACK_HOURS,
            )
            begin = earliest
        return begin, f"begin={begin.isoformat()}"

    hours = payload.get("lookbackHours") or os.getenv("MAIL_DELIVERY_SYNC_LOOKBACK_HOURS")
    try:
        hours = float(hours) if hours else DEFAULT_LOOKBACK_HOURS
    except (TypeError, ValueError):
        logging.warning("Unusable lookbackHours %r, falling back to %d", hours, DEFAULT_LOOKBACK_HOURS)
        hours = DEFAULT_LOOKBACK_HOURS
    hours = max(0.0, min(float(hours), MAX_LOOKBACK_HOURS))

    return now - timedelta(hours=hours), f"lookback={hours}h"


def collect_statuses(mailgun_client, begin):
    """Reads every configured domain and reduces its events to one status per mail.

    Returns:
        tuple: ({maillogId: status}, counts dict, [domains that failed])
    """
    begin_timestamp = begin.timestamp()
    statuses = {}
    counts = {STATUS_DELIVERED: 0, STATUS_BOUNCED: 0, STATUS_COMPLAINED: 0}
    unkeyed = 0
    failed_domains = []

    for domain in mailgun_client.domains:
        try:
            for event in mailgun_client.iter_events(domain, begin_timestamp):
                status = classify_event(event)
                if status is None:
                    continue

                # Counted per event, not per mail: the bounce rate is about how
                # much mail this window decided, and dedup would understate a
                # domain that bounced the same address repeatedly.
                counts[status] += 1

                mail_id = maillog_id(event)
                if mail_id is None:
                    unkeyed += 1
                    continue

                current = statuses.get(mail_id)
                if current is None or PRECEDENCE[status] > PRECEDENCE[current]:
                    statuses[mail_id] = status
        except Exception as error:
            # One unverified or key-restricted domain must not cost the run the
            # domains that do work -- notably, the prod sending key is
            # domain-restricted, so a new portal host can 401 on its own.
            logging.exception("Reading Mailgun events for %s failed", domain)
            failed_domains.append({"domain": domain, "error": str(error)})

    if unkeyed:
        # Expected for anything sent before v:maillogId existed; a steady stream
        # of these later would mean the send path stopped attaching it.
        logging.info("%d event(s) carried no maillogId and were counted but not applied", unkeyed)

    return statuses, counts, failed_domains


def apply_statuses(eduhub_client, statuses):
    """Writes the statuses onto MailLog, never downgrading a row.

    Returns:
        dict: {status: affected_rows}
    """
    applied = {}

    # Ascending precedence, so that when the same window decides both DELIVERED
    # and COMPLAINED for one mail the stronger write lands last regardless of
    # how the ids are chunked.
    for status in sorted(PRECEDENCE, key=PRECEDENCE.get):
        ids = sorted(mail_id for mail_id, value in statuses.items() if value == status)
        if not ids:
            continue

        blocked = [other for other, rank in PRECEDENCE.items() if rank >= PRECEDENCE[status]]
        affected = 0

        for start in range(0, len(ids), UPDATE_CHUNK_SIZE):
            chunk = ids[start:start + UPDATE_CHUNK_SIZE]
            where = {"id": {"_in": chunk}}
            if blocked:
                # status is nullable, and NOT IN never matches NULL, so the
                # null case has to be spelled out or rows that were never given
                # a status would be skipped.
                where["_or"] = [
                    {"status": {"_is_null": True}},
                    {"status": {"_nin": blocked}},
                ]

            mutation = """
            mutation SetMailDeliveryStatus($where: MailLog_bool_exp!, $status: String!) {
                update_MailLog(where: $where, _set: {status: $status}) {
                    affected_rows
                }
            }
            """
            result = eduhub_client.send_query(mutation, {"where": where, "status": status})
            if not isinstance(result, dict) or result.get("errors"):
                logging.error("Failed to set %s on %d mail(s): %s", status, len(chunk), result)
                continue
            affected += result["data"]["update_MailLog"]["affected_rows"]

        applied[status] = affected
        logging.info("Set %s on %d MailLog row(s)", status, affected)

    return applied


def bounce_rate(counts):
    """Permanent failures as a share of the mail this window actually decided.

    Complaints are excluded from the denominator: a complaint is a delivered
    mail the recipient disliked, not a delivery failure, so counting it would
    dilute exactly the signal this is here to catch.
    """
    decided = counts[STATUS_DELIVERED] + counts[STATUS_BOUNCED]
    if decided == 0:
        return 0.0, 0
    return counts[STATUS_BOUNCED] / decided, decided


def check_bounce_threshold(eduhub_client, counts, window_description):
    """Logs and mails the admin when the window's bounce rate is out of band.

    Returns:
        dict|None: the alert that was raised, or None.
    """
    rate, decided = bounce_rate(counts)
    if decided < BOUNCE_RATE_MIN_SAMPLE or rate <= BOUNCE_RATE_THRESHOLD:
        return None

    percent = round(rate * 100, 1)
    logging.error(
        "Mail bounce rate %.1f%% over %s (%d bounced of %d decided) exceeds the %.0f%% threshold",
        percent,
        window_description,
        counts[STATUS_BOUNCED],
        decided,
        BOUNCE_RATE_THRESHOLD * 100,
    )

    alert = {
        "bounceRatePercent": percent,
        "bounced": counts[STATUS_BOUNCED],
        "delivered": counts[STATUS_DELIVERED],
        "decided": decided,
        "window": window_description,
        "mailed": False,
    }

    recipient = os.getenv("MAIL_DELIVERY_ALERT_EMAIL") or os.getenv("STUJO_ADMIN_EMAIL")
    if not recipient:
        logging.error("No MAIL_DELIVERY_ALERT_EMAIL/STUJO_ADMIN_EMAIL configured; alert not mailed")
        return alert

    # One mail per UTC day. The log line above fires on every run so the
    # condition stays visible, but a sustained problem must not turn into an
    # hourly mail -- and the alert itself is mail, so a genuinely broken mail
    # path would otherwise amplify itself.
    day = datetime.now(timezone.utc).date().isoformat()
    if already_sent_keys(eduhub_client, ALERT_MAIL_TYPE, [{"day": day}], ["day"]):
        logging.info("Bounce-rate alert for %s already sent", day)
        return alert

    template = {
        "subject": f"[EduHub] Zustellquote auffällig: {percent}% Bounces",
        "content": (
            "<p>Die Bounce-Quote der letzten Zustellungen liegt über dem Schwellwert.</p>"
            f"<ul><li>Bounce-Quote: <strong>{percent}%</strong> "
            f"(Schwellwert {BOUNCE_RATE_THRESHOLD * 100:.0f}%)</li>"
            f"<li>Dauerhaft fehlgeschlagen: {counts[STATUS_BOUNCED]}</li>"
            f"<li>Zugestellt: {counts[STATUS_DELIVERED]}</li>"
            f"<li>Beschwerden: {counts[STATUS_COMPLAINED]}</li>"
            f"<li>Zeitfenster: {window_description}</li></ul>"
            "<p>Bitte prüfen, ob gerade ein Massenversand mit einer veralteten "
            "Empfängerliste läuft, und ihn gegebenenfalls stoppen, bevor weitere "
            "Batches rausgehen. Betroffene Adressen stehen in MailLog mit Status "
            "BOUNCED.</p>"
        ),
        "from": f"noreply@{_sender_domain()}",
    }
    alert["mailed"] = queue_mail(
        eduhub_client,
        template,
        recipient,
        {},
        metadata={"type": ALERT_MAIL_TYPE, "day": day},
    )
    return alert


def _sender_domain():
    """The domain the alert mail is sent from -- sendMail only signs its own."""
    from api_clients.mailgun_client import configured_domains

    domains = configured_domains()
    return domains[0] if domains else "opencampus.sh"


def sync_mail_delivery_status(arguments):
    """
    Pulls Mailgun delivery events and records the outcome on each MailLog row,
    then checks the window's bounce rate against BOUNCE_RATE_THRESHOLD.

    Runs hourly via the sync_mail_delivery_status cron trigger. Also usable as a
    one-off backfill by passing {"lookbackHours": N} or {"begin": "<ISO>"}.

    Args:
        arguments (dict): Cron payload; optional "lookbackHours" / "begin".

    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (dict, optional): Event counts, rows updated, any alert
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Sync Mail Delivery Status Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        eduhub_client = EduHubClient()
        mailgun_client = MailgunClient()

        begin, window_description = resolve_begin(arguments)
        logging.info(
            "Reading Mailgun events since %s for %s",
            begin.isoformat(),
            ", ".join(mailgun_client.domains),
        )

        statuses, counts, failed_domains = collect_statuses(mailgun_client, begin)
        applied = apply_statuses(eduhub_client, statuses)
        alert = check_bounce_threshold(eduhub_client, counts, window_description)

        return {
            "success": True,
            "data": {
                "window": window_description,
                "begin": begin.isoformat(),
                "domains": mailgun_client.domains,
                "eventCounts": counts,
                "matchedMails": len(statuses),
                "updated": applied,
                "failedDomains": failed_domains,
                "alert": alert,
            },
        }

    except Exception as e:
        logging.exception("sync_mail_delivery_status failed")
        return {"success": False, "error": str(e)}
