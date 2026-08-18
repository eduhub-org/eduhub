"""
Shared helpers for the mail-sending cron jobs.

The reminder crons (invitation expiry, course continuation, project deadlines)
all follow the same shape: load a default MailTemplate, work out which
recipients already got the mail, and queue the rest via MailLog. The dedup
bookkeeping lives in MailLog.metadata, e.g.

    {"type": "COURSE_CONTINUATION_INQUIRY", "courseId": 7, "userId": 42}
"""

import html
import logging
from datetime import datetime

# Candidate keys per dedup query. Keeps the generated GraphQL document small
# when a run has an unusually large number of candidates.
DEDUP_CHUNK_SIZE = 200


def escape_html(text):
    """Escape a user-controlled value for interpolation into a mail body."""
    if not text:
        return ""
    return html.escape(str(text), quote=True)


def format_date(iso_string):
    """Format a timestamptz ISO string as DD.MM.YYYY (best-effort)."""
    if not iso_string:
        return ""
    try:
        # Handle trailing Z as well as explicit offsets
        return datetime.fromisoformat(iso_string.replace("Z", "+00:00")).strftime("%d.%m.%Y")
    except ValueError:
        return iso_string


def get_default_mail_template(client, template_type):
    """Fetch the default (courseId NULL) mail template of the given type."""
    query = """
    query GetDefaultMailTemplate($type: MailTemplateType_enum!) {
        MailTemplate(where: {type: {_eq: $type}, courseId: {_is_null: true}}, limit: 1) {
            subject
            content
            from
            cc
            bcc
        }
    }
    """
    result = client.send_query(query, {"type": template_type})
    if not isinstance(result, dict) or result.get("errors"):
        logging.warning(f"Could not load mail template {template_type}: {result}")
        return None
    templates = result.get("data", {}).get("MailTemplate", [])
    return templates[0] if templates else None


def already_sent_keys(client, mail_type, candidates, key_fields):
    """
    Of the given candidates, return those that already received `mail_type`.

    Args:
        client: EduHubClient
        mail_type (str): the MailLog.metadata "type" marker
        candidates (list[dict]): one dict per candidate holding `key_fields`,
            e.g. [{"courseId": 7, "userId": 42}, ...]
        key_fields (list[str]): metadata fields identifying a candidate

    Returns:
        set[tuple]: the already-mailed candidates as tuples in `key_fields` order

    The query is restricted to the candidate keys of this run rather than
    scanning the full MailLog history, so its cost tracks the size of the run
    and not the amount of mail ever sent. MailLog_metadata_idx (GIN) serves the
    containment lookups.
    """
    sent = set()
    if not candidates:
        return sent

    query = """
    query AlreadySentMails($where: MailLog_bool_exp!) {
        MailLog(where: $where) {
            metadata
        }
    }
    """

    for start in range(0, len(candidates), DEDUP_CHUNK_SIZE):
        chunk = candidates[start:start + DEDUP_CHUNK_SIZE]
        clauses = []
        for candidate in chunk:
            contains = {"type": mail_type}
            for field in key_fields:
                contains[field] = candidate.get(field)
            clauses.append({"metadata": {"_contains": contains}})

        result = client.send_query(query, {"where": {"_or": clauses}})
        if not isinstance(result, dict) or result.get("errors"):
            # Fail closed: treating candidates as "already sent" risks a missing
            # mail, treating them as "not sent" risks a duplicate. Skipping the
            # chunk keeps this run silent and the next one retries.
            logging.error(f"Dedup lookup failed for {mail_type}: {result}")
            for candidate in chunk:
                sent.add(tuple(candidate.get(field) for field in key_fields))
            continue

        for row in result.get("data", {}).get("MailLog", []):
            meta = row.get("metadata") or {}
            sent.add(tuple(meta.get(field) for field in key_fields))

    return sent


def queue_mail(client, template, to, variables, metadata=None):
    """
    Insert a MailLog row; the insert event trigger sends it via Mailgun.

    Args:
        client: EduHubClient
        template (dict): MailTemplate row (subject, content, from, cc, bcc)
        to (str): recipient address
        variables (dict): template variable -> raw plain-text value. Ready-made
            HTML fragments do not belong here: body values are escaped.
        metadata (dict|None): dedup marker stored on the MailLog row

    Values are HTML-escaped for the body but inserted verbatim into the
    subject, which is plain text and would show entities literally.
    """
    if not to:
        return False

    subject = template["subject"]
    content = template["content"]
    for key, value in variables.items():
        raw = "" if value is None else str(value)
        subject = subject.replace(key, raw)
        content = content.replace(key, escape_html(raw))

    mutation = """
    mutation QueueMail(
        $subject: String!, $content: String!, $from: String!, $to: String!,
        $cc: String, $bcc: String, $metadata: jsonb
    ) {
        insert_MailLog_one(object: {
            subject: $subject, content: $content, from: $from, to: $to,
            cc: $cc, bcc: $bcc, status: "READY_TO_SEND", metadata: $metadata
        }) {
            id
        }
    }
    """
    result = client.send_query(mutation, {
        "subject": subject,
        "content": content,
        "from": template.get("from") or "noreply@opencampus.sh",
        "to": to,
        "cc": template.get("cc"),
        "bcc": template.get("bcc"),
        "metadata": metadata,
    })
    if not isinstance(result, dict) or result.get("errors"):
        logging.error(f"Failed to queue mail to {to}: {result}")
        return False
    return True
