"""Zoom API client for retrieving meeting attendance.

Attendance is gathered by:

1. Listing past instances of a Zoom meeting id via
   ``GET /v2/past_meetings/{meetingId}/instances``.
2. Filtering those instances to the ones that overlap the EduHub session
   window (plus a configurable grace buffer on either side).
3. Pulling the participant report for *each* surviving instance via
   ``GET /v2/report/meetings/{meetingUuid}/participants`` with pagination.
4. Aggregating each participant's activity across all instances so that
   reconnects / rescheduled-right-after calls are collapsed to one row.

This replaces the previous single-call behaviour (which implicitly relied
on Zoom's "last occurrence" semantics and was confused by post-session
reconnects spawning fresh meetings).
"""

import base64
import json
import logging
import os
import time
import urllib.parse
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple, Union

import pandas as pd
import requests


# Default grace buffers (in minutes) for matching Zoom instances to a session
# window. Overridable via env vars to avoid code changes for tuning.
DEFAULT_PRE_BUFFER_MIN = 30
DEFAULT_POST_BUFFER_MIN = 120

# Default HTTP timeout for all Zoom API calls. A hang on any endpoint would
# stall the daily attendance cron and block subsequent sessions from being
# processed, so every ``requests`` call in this module must pass a timeout.
# Tuple = (connect_timeout, read_timeout) in seconds. Overridable via the
# ``ZOOM_HTTP_TIMEOUT_SEC`` env var which, if set, applies to both values.
DEFAULT_TIMEOUT = (10, 30)


def _resolve_default_timeout():
    raw = os.getenv("ZOOM_HTTP_TIMEOUT_SEC")
    if raw is None or str(raw).strip() == "":
        return DEFAULT_TIMEOUT
    try:
        seconds = float(raw)
    except ValueError:
        logging.warning(
            "Invalid ZOOM_HTTP_TIMEOUT_SEC=%r; using default %s.", raw, DEFAULT_TIMEOUT
        )
        return DEFAULT_TIMEOUT
    return (seconds, seconds)


class ZoomAttendanceError(Exception):
    """Raised when Zoom attendance for a session cannot be fully
    collected (e.g. one or more meeting-instance participant fetches
    failed).

    Callers should treat the session as *not yet processed* — i.e. not
    write ``Session.attendanceData`` and not insert partial ``Attendance``
    rows — so the session remains eligible for retry on the next cron
    run instead of being silently recorded as processed with holes in
    the data.

    Carries the offending ``meeting_id`` and the list of ``failed_uuids``
    so operators can correlate logs with Zoom meeting occurrences.
    """

    def __init__(self, message, meeting_id=None, failed_uuids=None):
        super().__init__(message)
        self.meeting_id = meeting_id
        self.failed_uuids = list(failed_uuids) if failed_uuids else []


class ZoomClient:
    def __init__(self):
        self.api_key = os.getenv("ZOOM_API_KEY")
        self.api_secret = os.getenv("ZOOM_API_SECRET")
        self.account_id = os.getenv("ZOOM_ACCOUNT_ID")
        self.base_url = "https://api.zoom.us/v2"
        self.reports_url = f"{self.base_url}/report/meetings"
        self.past_meetings_url = f"{self.base_url}/past_meetings"
        # Single source of truth for HTTP timeouts across every Zoom call
        # (OAuth, report, past_meetings, future endpoints). Kept as an
        # instance attribute so tests can override without touching the
        # module-level default.
        self._timeout = _resolve_default_timeout()
        self.access_token, self.token_expiration = self.fetch_access_token()

    # ------------------------------------------------------------------
    # Setters kept for backwards compatibility with existing tests / callers.
    # ------------------------------------------------------------------

    def set_api_key(self, api_key: str):
        self.api_key = api_key

    def set_api_secret(self, api_secret: str):
        self.api_secret = api_secret

    # ------------------------------------------------------------------
    # Time / token helpers
    # ------------------------------------------------------------------

    def to_datetime(self, date_time):
        """Convert a Zoom-format UTC datetime string/Series to Europe/Berlin."""
        zoom_format = "%Y-%m-%dT%H:%M:%SZ"
        zoom_timezone = "UTC"
        reference_timezone = "Europe/Berlin"
        return (
            pd.to_datetime(date_time, format=zoom_format)
            .dt.tz_localize(zoom_timezone)
            .dt.tz_convert(reference_timezone)
        )

    def fetch_access_token(self):
        """Fetch a new Server-to-Server OAuth access token from Zoom.

        Returns ``(access_token, token_expiration_epoch)``. The second
        element is an *absolute* epoch timestamp (seconds since the unix
        epoch), not a relative TTL. Callers — including ``validate_token``
        and the constructor — store it on ``self.token_expiration`` and
        later compare ``time.time()`` against it directly, so returning
        anything other than an absolute epoch would make the cache check
        always trigger a refresh.
        """
        url = "https://zoom.us/oauth/token"
        auth_header = {
            "Authorization": f"Basic {base64.b64encode(f'{self.api_key}:{self.api_secret}'.encode()).decode()}"
        }
        body = {"grant_type": "account_credentials", "account_id": self.account_id}
        # ``_timeout`` is not yet set when this runs from ``__init__``, so
        # fall back to the module default for the very first token fetch.
        timeout = getattr(self, "_timeout", None) or _resolve_default_timeout()
        response = requests.post(url, headers=auth_header, data=body, timeout=timeout)

        if response.status_code == 200:
            response_data = json.loads(response.text)
            access_token = response_data.get("access_token")
            expires_in = response_data.get("expires_in")  # seconds

            if not access_token or not expires_in:
                raise Exception("Invalid OAuth token response")

            token_expiration = time.time() + expires_in
            self.token_expiration = token_expiration
            return access_token, token_expiration
        else:
            raise Exception(f"Failed to fetch OAuth token: {response.text}")

    def validate_token(self):
        buffer_time = 10  # seconds
        if (
            not self.access_token
            or not self.token_expiration
            or time.time() > (self.token_expiration - buffer_time)
        ):
            # fetch_access_token returns (token, absolute_expiration_epoch).
            self.access_token, self.token_expiration = self.fetch_access_token()

    # ------------------------------------------------------------------
    # Low-level HTTP wrappers
    # ------------------------------------------------------------------

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    def _get(
        self, url: str, params: Optional[Dict[str, Any]] = None
    ) -> requests.Response:
        self.validate_token()
        return requests.get(
            url,
            headers=self._auth_headers(),
            params=params,
            timeout=self._timeout,
        )

    @staticmethod
    def _encode_meeting_uuid(meeting_uuid: str) -> str:
        """Zoom requires meeting UUIDs to be double URL-encoded when they
        contain a forward slash (``/``) or start with ``/`` or ``//``.

        See: https://developers.zoom.us/docs/api/meetings/#tag/reports --
        the "Double encode your UUID" note under report endpoints.
        Numeric meeting ids and plain base64 UUIDs are passed through
        unchanged, so this is safe to always call.
        """
        if meeting_uuid is None:
            return meeting_uuid
        if meeting_uuid.startswith("/") or "//" in meeting_uuid:
            return urllib.parse.quote(
                urllib.parse.quote(meeting_uuid, safe=""), safe=""
            )
        return urllib.parse.quote(meeting_uuid, safe="")

    # ------------------------------------------------------------------
    # Endpoint wrappers
    # ------------------------------------------------------------------

    def list_past_meeting_instances(
        self, meeting_id: Union[str, int]
    ) -> List[Dict[str, Any]]:
        """Return the list of completed occurrences for ``meeting_id``.

        Each element has at least ``uuid`` and ``start_time`` (UTC, ISO-8601).
        Returns an empty list when Zoom reports no instances (e.g., the
        meeting never actually ran or the numeric id is unknown).
        """
        url = f"{self.past_meetings_url}/{meeting_id}/instances"
        response = self._get(url)
        if response.status_code == 404:
            logging.warning(
                "Zoom past_meetings/instances returned 404 for meeting_id=%s; "
                "falling back to report-by-id behaviour.",
                meeting_id,
            )
            return []
        if response.status_code != 200:
            raise Exception(
                f"Failed to list past meeting instances for {meeting_id}: "
                f"{response.status_code} {response.text}"
            )
        payload = response.json() or {}
        return payload.get("meetings", []) or []

    def get_meeting_instance_participants(
        self, meeting_uuid: str
    ) -> List[Dict[str, Any]]:
        """Fetch *all* participant report pages for a specific Zoom meeting
        occurrence (identified by UUID). Handles double-URL-encoding and
        pagination via ``next_page_token``.
        """
        encoded = self._encode_meeting_uuid(meeting_uuid)
        url = f"{self.reports_url}/{encoded}/participants"
        return self._fetch_participants(url)

    def get_meeting_participants_by_id(
        self, meeting_id: Union[str, int]
    ) -> List[Dict[str, Any]]:
        """Legacy path: fetch participants for the *last* occurrence of a
        numeric meeting id (Zoom's default behaviour when no UUID is given).
        Kept as a fallback for accounts / meetings where the
        ``past_meetings/instances`` endpoint returns nothing.
        """
        url = f"{self.reports_url}/{meeting_id}/participants"
        return self._fetch_participants(url)

    def _fetch_participants(self, url: str) -> List[Dict[str, Any]]:
        """Loop through ``next_page_token`` pages for a participants URL."""
        all_participants: List[Dict[str, Any]] = []
        next_page_token: Optional[str] = None
        # Defensive cap on page iterations to avoid infinite loops on
        # misbehaving responses; 50 * 3000 = 150000 participants.
        max_pages = 50
        for _ in range(max_pages):
            params: Dict[str, Any] = {"page_size": 300}
            if next_page_token:
                params["next_page_token"] = next_page_token
            response = self._get(url, params=params)
            if response.status_code != 200:
                raise Exception(
                    f"Zoom participants request failed: {response.status_code} "
                    f"{response.text}"
                )
            payload = response.json() or {}
            all_participants.extend(payload.get("participants", []) or [])
            next_page_token = payload.get("next_page_token") or None
            if not next_page_token:
                break
        else:
            logging.warning(
                "Zoom participants pagination hit max_pages=%s for url=%s; "
                "data may be truncated.",
                max_pages,
                url,
            )
        return all_participants

    # ------------------------------------------------------------------
    # Deprecated thin wrapper: keep the old method name for callers /
    # tests that imported it directly. Prefer the explicit endpoints above.
    # ------------------------------------------------------------------

    def get_last_meeting_session(
        self, meeting_id: str, next_page_token: Optional[str] = None
    ) -> requests.Response:
        self.validate_token()
        url = f"{self.reports_url}/{meeting_id}/participants"
        query_params: Dict[str, Union[int, str]] = {"page_size": 3000}
        if next_page_token:
            query_params.update({"next_page_token": next_page_token})
        return requests.get(
            url,
            headers=self._auth_headers(),
            params=query_params,
            timeout=self._timeout,
        )

    def zoom_get_meeting_report(self, meeting_id: str) -> requests.Response:
        self.validate_token()
        url = f"{self.reports_url}/{meeting_id}"
        return requests.get(url, headers=self._auth_headers(), timeout=self._timeout)

    # ------------------------------------------------------------------
    # Meeting URL / id utilities
    # ------------------------------------------------------------------

    def get_meeting_id(self, meeting_url: str) -> str:
        """Extract the numeric meeting id from a Zoom join URL.

        Strips the ``http(s)://.../j/`` prefix and any ``?pwd=...`` suffix.
        """
        if meeting_url[:4] == "http" or meeting_url.find("/j/") > 0:
            meeting_url = meeting_url.split("/j/")[1]
        if meeting_url.find("?") > 0:
            meeting_url = meeting_url[: meeting_url.index("?")]
        return meeting_url

    # ------------------------------------------------------------------
    # Instance selection
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_buffer_env(name: str, default_min: int) -> pd.Timedelta:
        raw = os.getenv(name)
        if raw is None or str(raw).strip() == "":
            return pd.Timedelta(minutes=default_min)
        try:
            return pd.Timedelta(minutes=float(raw))
        except ValueError:
            logging.warning(
                "Invalid value for %s=%r; falling back to %s min.",
                name,
                raw,
                default_min,
            )
            return pd.Timedelta(minutes=default_min)

    def _get_pre_buffer(self) -> pd.Timedelta:
        return self._parse_buffer_env(
            "ZOOM_ATTENDANCE_PRE_BUFFER_MIN", DEFAULT_PRE_BUFFER_MIN
        )

    def _get_post_buffer(self) -> pd.Timedelta:
        return self._parse_buffer_env(
            "ZOOM_ATTENDANCE_POST_BUFFER_MIN", DEFAULT_POST_BUFFER_MIN
        )

    @staticmethod
    def _to_utc_timestamp(value: Any) -> Optional[pd.Timestamp]:
        """Coerce a timezone-aware or naive value to a UTC ``pd.Timestamp``.

        Naive inputs are assumed to be UTC (matches Zoom's response format).
        Returns ``None`` for null/blank/unparseable input.
        """
        if value is None:
            return None
        try:
            ts = pd.Timestamp(value)
        except Exception:
            return None
        if ts is pd.NaT or pd.isna(ts):
            return None
        if ts.tzinfo is None:
            ts = ts.tz_localize("UTC")
        else:
            ts = ts.tz_convert("UTC")
        return ts

    def filter_instances_by_session_window(
        self,
        instances: Iterable[Dict[str, Any]],
        session_start: Any,
        session_end: Any,
        pre_buffer: Optional[pd.Timedelta] = None,
        post_buffer: Optional[pd.Timedelta] = None,
    ) -> List[Dict[str, Any]]:
        """Return instances whose ``start_time`` falls inside
        ``[session_start - pre_buffer, session_end + post_buffer)``.

        Zoom's ``past_meetings/instances`` response only contains each
        instance's ``start_time`` (not its end time), so filtering is by
        start only. The post-buffer exists exactly to catch instances that
        were started shortly before the scheduled end — or a reconnect
        spawned mid-class — while excluding calls that start well after
        the session is over.
        """
        pre = pre_buffer if pre_buffer is not None else self._get_pre_buffer()
        post = post_buffer if post_buffer is not None else self._get_post_buffer()

        start_ts = self._to_utc_timestamp(session_start)
        end_ts = self._to_utc_timestamp(session_end)
        if start_ts is None or end_ts is None:
            raise ValueError(
                "Session start/end must be provided to filter Zoom instances"
            )

        window_start = start_ts - pre
        window_end = end_ts + post

        kept: List[Dict[str, Any]] = []
        for inst in instances:
            inst_start = self._to_utc_timestamp(inst.get("start_time"))
            if inst_start is None:
                logging.debug(
                    "Skipping Zoom instance without parseable start_time: %s", inst
                )
                continue
            if window_start <= inst_start < window_end:
                kept.append({**inst, "_start_time_utc": inst_start})
        kept.sort(key=lambda r: r["_start_time_utc"])
        return kept

    # ------------------------------------------------------------------
    # Aggregation
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise_name(name: Any) -> str:
        if name is None:
            return ""
        return str(name).strip().lower()

    @staticmethod
    def _identity_key(row: Dict[str, Any]) -> Tuple[str, str]:
        """Return a ``(key_kind, key_value)`` tuple for grouping participant
        rows that belong to the same person.

        Priority: email > Zoom user_id > normalised display name. This
        collapses reconnects (same email on different devices) into one
        row while still producing *some* grouping when email is absent.
        """
        email = row.get("user_email") or row.get("email")
        if email:
            email_key = str(email).strip().lower()
            if email_key:
                return ("email", email_key)
        user_id = row.get("user_id") or row.get("id")
        if user_id:
            user_id_key = str(user_id).strip()
            if user_id_key:
                return ("user_id", user_id_key)
        name = ZoomClient._normalise_name(row.get("name"))
        return ("name", name)

    @staticmethod
    def _merge_intervals(
        intervals: List[Tuple[pd.Timestamp, pd.Timestamp]]
    ) -> List[Tuple[pd.Timestamp, pd.Timestamp]]:
        """Merge overlapping/adjacent ``(start, end)`` intervals."""
        valid = [(s, e) for s, e in intervals if s is not None and e is not None and e >= s]
        if not valid:
            return []
        valid.sort(key=lambda r: r[0])
        merged = [valid[0]]
        for start, end in valid[1:]:
            last_start, last_end = merged[-1]
            if start <= last_end:
                if end > last_end:
                    merged[-1] = (last_start, end)
            else:
                merged.append((start, end))
        return merged

    @classmethod
    def _merge_groups_by_display_name(
        cls,
        groups: Dict[Tuple[str, str], List[Dict[str, Any]]],
    ) -> List[List[Dict[str, Any]]]:
        """Second-pass group union: collapse identity-key groups that share
        an identical (normalised) display name, unless they carry
        conflicting non-empty emails.

        :py:meth:`_identity_key` falls back ``email`` -> ``user_id`` ->
        normalised name. That cannot bridge the case where the same
        person's raw rows spill across multiple keys -- e.g. a logged-in
        join (email set) followed by a wifi-drop reconnect as a guest
        (fresh ``user_id``, no email). Both carry the same display name;
        this pass unions them so the caller can recompute
        ``interruptionCount`` and the total duration across the combined
        interval list instead of emitting two output rows that the UI
        then renders as duplicates.

        Safety guard: if the groups that share a display name carry more
        than one distinct non-empty email, they are NOT merged (two
        different people who happen to share a display name).

        Groups whose rows carry no non-empty display name are passed
        through untouched so "unknown" guests are never fused together.

        Returns a list of row bundles in the order the first contributing
        group was seen in ``groups``, preserving the existing iteration
        order.
        """
        name_index: Dict[str, List[Tuple[str, str]]] = {}
        for key, rows in groups.items():
            names = [
                str(r.get("name")).strip()
                for r in rows
                if r.get("name") is not None and str(r.get("name")).strip() != ""
            ]
            if not names:
                continue
            most_common = max(set(names), key=names.count)
            normalised = cls._normalise_name(most_common)
            if normalised:
                name_index.setdefault(normalised, []).append(key)

        bundle_of: Dict[Tuple[str, str], Tuple[str, str]] = {}
        for _normalised, keys in name_index.items():
            if len(keys) < 2:
                continue
            distinct_emails: Set[str] = set()
            for k in keys:
                for r in groups[k]:
                    email_value = r.get("user_email") or r.get("email")
                    if email_value:
                        cleaned = str(email_value).strip().lower()
                        if cleaned:
                            distinct_emails.add(cleaned)
            if len(distinct_emails) > 1:
                continue
            representative = keys[0]
            for k in keys:
                bundle_of[k] = representative

        bundles: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        order: List[Tuple[str, str]] = []
        for key, rows in groups.items():
            representative = bundle_of.get(key, key)
            if representative not in bundles:
                bundles[representative] = []
                order.append(representative)
            bundles[representative].extend(rows)

        return [bundles[representative] for representative in order]

    def aggregate_participants(
        self, instance_rows: List[Dict[str, Any]]
    ) -> pd.DataFrame:
        """Collapse raw per-instance participant rows to one row per person.

        Input rows are expected to have Zoom's native fields
        (``name``, ``user_email``/``email``, ``join_time``, ``leave_time``,
        ``duration``) plus the augmented ``_meeting_uuid`` / ``_instance_start``
        added by :py:meth:`get_session_attendance`.
        """
        if not instance_rows:
            return pd.DataFrame(
                columns=[
                    "name",
                    "email",
                    "joinDateTime",
                    "leaveDateTime",
                    "duration",
                    "interruptionCount",
                    "meetingUuids",
                    "instanceStarts",
                ]
            )

        groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for row in instance_rows:
            key = self._identity_key(row)
            groups.setdefault(key, []).append(row)

        # Second pass: fuse identity-key groups that clearly belong to the
        # same person (identical normalised display name, no conflicting
        # emails). Must run before interval aggregation so the recomputed
        # interruptionCount reflects the union of raw intervals rather
        # than a naive sum of per-group counts (which would yield 0+0=0
        # for two disjoint continuous chunks and lose the interruption).
        final_groups = self._merge_groups_by_display_name(groups)

        aggregated = []
        for rows in final_groups:
            intervals: List[Tuple[pd.Timestamp, pd.Timestamp]] = []
            emails = []
            names = []
            meeting_uuids = []
            instance_starts = []
            for r in rows:
                join = self._to_utc_timestamp(r.get("join_time"))
                leave = self._to_utc_timestamp(r.get("leave_time"))
                if join is not None and leave is not None:
                    intervals.append((join, leave))
                email_value = r.get("user_email") or r.get("email")
                if email_value:
                    emails.append(str(email_value).strip().lower())
                name_value = r.get("name")
                if name_value is not None and str(name_value).strip() != "":
                    names.append(str(name_value).strip())
                mu = r.get("_meeting_uuid")
                if mu:
                    meeting_uuids.append(mu)
                inst_start = r.get("_instance_start")
                if inst_start is not None:
                    instance_starts.append(str(inst_start))

            merged = self._merge_intervals(intervals)
            total_duration = int(sum((e - s).total_seconds() for s, e in merged))
            join_dt = merged[0][0] if merged else None
            leave_dt = merged[-1][1] if merged else None
            # Number of separate joins = number of merged intervals; a single
            # continuous presence implies zero interruptions.
            interruption_count = max(len(merged) - 1, 0) if merged else 0

            most_common_name = (
                max(set(names), key=names.count) if names else None
            )
            most_common_email = (
                max(set(emails), key=emails.count) if emails else None
            )

            aggregated.append(
                {
                    "name": most_common_name,
                    "email": most_common_email,
                    "joinDateTime": join_dt,
                    "leaveDateTime": leave_dt,
                    "duration": total_duration if merged else None,
                    "interruptionCount": interruption_count if merged else None,
                    "meetingUuids": sorted(set(meeting_uuids)),
                    "instanceStarts": sorted(set(instance_starts)),
                }
            )

        df = pd.DataFrame(aggregated)
        return df

    # ------------------------------------------------------------------
    # Public entry point used by check_attendance
    # ------------------------------------------------------------------

    def get_session_attendance(
        self,
        meeting_url: str,
        session_start: Any = None,
        session_end: Any = None,
    ) -> pd.DataFrame:
        """Return aggregated attendance data for a Zoom meeting scoped to
        a specific EduHub session time window.

        When ``session_start``/``session_end`` are not provided (legacy
        callers), this degrades to the pre-rework behaviour of fetching
        participants for the numeric meeting id directly.
        """
        logging.info("Getting online attendances from Zoom")
        meeting_id = self.get_meeting_id(meeting_url)

        if session_start is None or session_end is None:
            logging.warning(
                "get_session_attendance called without session window; "
                "falling back to report-by-id behaviour."
            )
            participants = self.get_meeting_participants_by_id(meeting_id)
            return self.aggregate_participants(
                [dict(p, _meeting_uuid=None, _instance_start=None) for p in participants]
            )

        # Deliberately do NOT swallow exceptions from
        # list_past_meeting_instances: a transient Zoom / network error
        # must propagate so check_attendance can leave Session.attendanceData
        # untouched and retry on the next cron run, rather than writing
        # partial or blank attendance and marking the session processed.
        instances = self.list_past_meeting_instances(meeting_id)

        # Legacy fallback applies *only* when Zoom reports no past
        # instances at all for the meeting id. In that case the numeric
        # report endpoint is the best signal we have (used historically
        # before this rework).
        if not instances:
            logging.warning(
                "Zoom meeting %s has no past instances; falling back to "
                "report-by-id behaviour.",
                meeting_id,
            )
            participants = self.get_meeting_participants_by_id(meeting_id)
            return self.aggregate_participants(
                [dict(p, _meeting_uuid=None, _instance_start=None) for p in participants]
            )

        relevant = self.filter_instances_by_session_window(
            instances, session_start, session_end
        )

        logging.info(
            "Zoom meeting %s: %s past instances total, %s within session window",
            meeting_id,
            len(instances),
            len(relevant),
        )

        # Instances exist but none overlap the session window: returning
        # the legacy "last call" would pull an unrelated meeting's
        # participants (the exact failure mode this rework fixes).
        # Produce an empty aggregation instead and let check_attendance
        # record a clean "no attendance" session.
        if not relevant:
            logging.warning(
                "No Zoom instances for meeting %s overlap session window "
                "%s .. %s; recording empty attendance.",
                meeting_id,
                session_start,
                session_end,
            )
            return self.aggregate_participants([])

        all_rows: List[Dict[str, Any]] = []
        failed_uuids: List[str] = []
        for inst in relevant:
            uuid = inst.get("uuid")
            if not uuid:
                logging.warning(
                    "Skipping Zoom instance for meeting %s without uuid: %s",
                    meeting_id,
                    inst,
                )
                continue
            try:
                participants = self.get_meeting_instance_participants(uuid)
            except Exception as exc:
                logging.error(
                    "Failed to fetch participants for instance %s of meeting %s: %s",
                    uuid,
                    meeting_id,
                    exc,
                )
                failed_uuids.append(uuid)
                continue
            for p in participants:
                all_rows.append(
                    dict(p, _meeting_uuid=uuid, _instance_start=inst.get("start_time"))
                )

        # Any per-instance failure means the aggregated totals
        # (totalAttendanceTime, interruptionCount, etc.) would be wrong
        # for participants who were present in the failed instance.
        # Surface the failure so the caller can skip this session and
        # retry on the next run, rather than silently writing partial
        # attendance.
        if failed_uuids:
            raise ZoomAttendanceError(
                f"Failed to fetch participants for {len(failed_uuids)} of "
                f"{len(relevant)} Zoom instance(s) for meeting {meeting_id}: "
                f"{failed_uuids}",
                meeting_id=meeting_id,
                failed_uuids=failed_uuids,
            )

        if not all_rows:
            logging.warning(
                "No participant rows returned across %s instance(s) for meeting %s",
                len(relevant),
                meeting_id,
            )

        return self.aggregate_participants(all_rows)

    # ------------------------------------------------------------------
    # Backwards-compat: format_zoom_attendances used to do the "group by
    # name" step. Keep it available in case external callers import it,
    # but implement it on top of the richer aggregation so behaviour is
    # consistent.
    # ------------------------------------------------------------------

    def format_zoom_attendances(self, session_participants):
        rows = [
            dict(p, _meeting_uuid=None, _instance_start=None)
            for p in session_participants
        ]
        df = self.aggregate_participants(rows)
        # Preserve the legacy column names some downstream code expected.
        return df
