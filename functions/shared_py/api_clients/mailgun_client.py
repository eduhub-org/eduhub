"""Mailgun client for reading delivery events.

This is the read side of mail. The write side lives in the ``sendMail`` cloud
function (``functions/sendMail/index.js``), which sends each MailLog row through
the Mailgun messages API and attaches ``v:maillogId`` to it. Mailgun echoes
custom ``v:`` variables on every event it records for a message, so an event
read back here carries the exact MailLog primary key -- no address matching, no
message-id column, and no database write on the send path.

Only the events endpoint is used:

    GET /v3/<domain>/events?event=delivered OR failed OR complained&begin=<ts>

Two details that are easy to get wrong:

* **Region.** This account is on Mailgun EU, so the host is
  ``api.eu.mailgun.net``. The US host answers with an empty event list for an
  EU domain rather than an error, which would look exactly like "no mail was
  sent" and is the reason this is not left to a default.
* **Pagination.** The events endpoint does not return a total. It returns a
  page plus ``paging.next``, and the walk ends when a page comes back empty --
  not when a page comes back short.
"""

import logging
import os
from typing import Dict, Iterator, List, Optional

import requests

# Mailgun EU. The US region is api.mailgun.net; a mismatch reads as "no events".
DEFAULT_BASE_URL = "https://api.eu.mailgun.net"

# Mailgun's documented maximum for this endpoint.
PAGE_LIMIT = 300

# (connect, read). The sync cron runs hourly and has no partial-failure state to
# resume from, so a hung connection must fail fast enough to leave the run time
# for the domains that still work.
DEFAULT_TIMEOUT = (10, 30)

# A runaway paging loop would hold the invocation until the platform kills it.
# At PAGE_LIMIT events per page this caps one domain's run at 60k events, far
# above the largest batch this system has ever sent (1004).
MAX_PAGES = 200

# The three terminal outcomes. Mailgun accepts an OR filter expression here, so
# one walk per domain covers all of them and events arrive interleaved in time.
EVENT_FILTER = "delivered OR failed OR complained"


class MailgunClient:
    """Reads delivery events for the configured Mailgun sending domains."""

    def __init__(self, api_key=None, base_url=None, domains=None, timeout=DEFAULT_TIMEOUT):
        self.api_key = api_key if api_key is not None else os.getenv("MAILGUN_API_KEY")
        if not self.api_key:
            raise ValueError("MAILGUN_API_KEY is not set")

        self.base_url = (base_url or os.getenv("MAILGUN_API_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.domains = domains if domains is not None else configured_domains()
        if not self.domains:
            raise ValueError("No Mailgun sending domain configured (MAILGUN_DOMAIN)")
        self.timeout = timeout

    def iter_events(self, domain: str, begin_timestamp: float) -> Iterator[Dict]:
        """Yields delivered / failed / complained events for one domain.

        Args:
            domain: a verified Mailgun sending domain.
            begin_timestamp: Unix seconds; events at or after this are returned.

        Yields:
            dict: raw Mailgun event objects, oldest first.
        """
        url = f"{self.base_url}/v3/{domain}/events"
        params = {
            "event": EVENT_FILTER,
            "begin": begin_timestamp,
            # Oldest first, so a truncated walk still leaves the newest events
            # for the next run's overlapping window rather than losing the old.
            "ascending": "yes",
            "limit": PAGE_LIMIT,
        }

        for page in range(MAX_PAGES):
            payload = self._get(url, params)
            items = payload.get("items") or []
            for item in items:
                yield item

            # An empty page is the documented end of the walk. A short page is
            # not: Mailgun fills pages by time bucket, not by count.
            if not items:
                return

            url = (payload.get("paging") or {}).get("next")
            if not url:
                return
            # paging.next carries every parameter already.
            params = None

            if page == MAX_PAGES - 1:
                logging.error(
                    "Mailgun event walk for %s hit the %d page cap; "
                    "remaining events are left to the next run",
                    domain,
                    MAX_PAGES,
                )

    def _get(self, url: str, params: Optional[Dict]) -> Dict:
        response = requests.get(
            url,
            auth=("api", self.api_key),
            params=params,
            timeout=self.timeout,
        )
        # 401 here almost always means the key is scoped to a different domain
        # rather than being wrong outright -- the prod sending key is
        # domain-restricted -- so keep the domain in the message.
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError(f"Mailgun events: expected JSON object, got {type(payload).__name__}")
        return payload


def configured_domains() -> List[str]:
    """The sending domains to read events for.

    Mirrors ``configuredDomains()`` in functions/sendMail/index.js so the read
    side cannot drift from the write side: a domain that sendMail is allowed to
    send through is a domain whose bounces must be read back. Hard-coding the
    pair here would silently stop covering the next portal that gets added.
    """
    raw = [os.getenv("MAILGUN_DOMAIN", "")]
    raw.extend(os.getenv("MAILGUN_ADDITIONAL_DOMAINS", "").split(","))

    domains = []
    for entry in raw:
        domain = str(entry or "").strip().lower()
        if domain and domain not in domains:
            domains.append(domain)
    return domains


def maillog_id(event: Dict) -> Optional[int]:
    """The MailLog id a Mailgun event belongs to, or None.

    Mailgun returns user variables as strings, and events predating the
    ``v:maillogId`` change carry none at all -- those are skipped rather than
    guessed at from the recipient address, which is not unique in MailLog.
    """
    variables = event.get("user-variables") or {}
    raw = variables.get("maillogId")
    if raw is None:
        return None
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        logging.warning("Mailgun event carries an unusable maillogId: %r", raw)
        return None
