import logging
import os
from datetime import datetime, timezone
from api_clients import EduHubClient


def _get_mail_template(client, template_type):
    """Fetch the default (courseId NULL) mail template of the given type."""
    query = """
    query GetJobMailTemplate($type: MailTemplateType_enum!) {
        MailTemplate(where: {type: {_eq: $type}, courseId: {_is_null: true}}, limit: 1) {
            subject
            content
            from
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


def _queue_mail(client, template, to, variables):
    """Insert a MailLog row; the insert event trigger sends it via Mailgun."""
    subject = template["subject"]
    content = template["content"]
    for key, value in variables.items():
        subject = subject.replace(key, value)
        content = content.replace(key, value)
    mutation = """
    mutation QueueJobExpiryMail($subject: String!, $content: String!, $from: String!, $to: String!, $bcc: String) {
        insert_MailLog_one(object: {
            subject: $subject, content: $content, from: $from, to: $to,
            bcc: $bcc, status: "READY_TO_SEND"
        }) {
            id
        }
    }
    """
    result = client.send_query(mutation, {
        "subject": subject,
        "content": content,
        "from": template.get("from") or "noreply@stujo.net",
        "to": to,
        "bcc": template.get("bcc"),
    })
    if not isinstance(result, dict) or result.get("errors"):
        logging.error(f"Failed to queue expiry mail to {to}: {result}")
        return False
    return True


def expire_job_postings(arguments):
    """
    Flips PUBLISHED job postings whose expiresAt has passed to EXPIRED
    (StuJo job board). Runs daily via the expire_job_postings cron trigger
    and replaces both the Rails 2-month archiver and its evergreen
    ("recurring") renewal mechanism.

    Employer reminder mails ("your posting expired, re-post it here") are
    sent from here once the corresponding MailTemplate exists (phase 4 of
    docs/STUJO_INTEGRATION_PLAN.md).

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (dict, optional): Number of expired postings
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Expire Job Postings Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        eduhub_client = EduHubClient()
        now = datetime.now(timezone.utc).isoformat()

        # status is a Hasura enum table (is_enum), so the GraphQL document
        # must use enum literals (PUBLISHED / EXPIRED), not quoted strings.
        expire_mutation = """
        mutation ExpireJobPostings($now: timestamptz!) {
            update_JobPosting(
                where: {
                    status: {_eq: PUBLISHED},
                    expiresAt: {_lte: $now}
                },
                _set: {status: EXPIRED}
            ) {
                affected_rows
                returning {
                    id
                    title
                    organizationId
                    contactUserId
                    ContactUser {
                        email
                    }
                }
            }
        }
        """

        result = eduhub_client.send_query(expire_mutation, {"now": now})

        if not isinstance(result, dict):
            logging.error(f"Unexpected response from Hasura: {result}")
            return {"success": False, "error": str(result)}
        if result.get("errors"):
            logging.error(f"GraphQL errors: {result['errors']}")
            return {"success": False, "error": str(result["errors"])}

        expired = result["data"]["update_JobPosting"]["returning"]
        logging.info(f"Expired {len(expired)} job posting(s)")

        # Expiry reminder with a re-post link (template
        # JOB_POSTING_EXPIRED, seeded by add_job_posting_mail_templates).
        # Mails are queued via MailLog; the insert event trigger delivers
        # them through the sendMail function.
        template = _get_mail_template(eduhub_client, "JOB_POSTING_EXPIRED")
        frontend_url = os.environ.get("STUJO_FRONTEND_URL") or os.environ.get("FRONTEND_URL") or ""
        mailed = 0
        for posting in expired:
            logging.info(
                f"Expired posting {posting['id']} ('{posting['title']}') "
                f"of organization {posting['organizationId']}"
            )
            email = (posting.get("ContactUser") or {}).get("email")
            if not template or not email:
                continue
            variables = {
                "[JobPosting:Title]": posting["title"],
                "[JobPosting:RepostUrl]": f"{frontend_url}/mein-stujo?repost={posting['id']}",
                "[JobPosting:DashboardUrl]": f"{frontend_url}/mein-stujo",
            }
            if _queue_mail(eduhub_client, template, email, variables):
                mailed += 1

        return {
            "success": True,
            "data": {"expiredCount": len(expired), "mailedCount": mailed},
        }

    except Exception as e:
        logging.exception("expire_job_postings failed")
        return {"success": False, "error": str(e)}
