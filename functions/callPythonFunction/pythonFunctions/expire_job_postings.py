import logging
from datetime import datetime, timezone
from api_clients import EduHubClient


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
        for posting in expired:
            logging.info(
                f"Expired posting {posting['id']} ('{posting['title']}') "
                f"of organization {posting['organizationId']}"
            )

        # TODO (phase 4): send the expiry reminder mail with a re-post link
        # to each posting's contact user via the sendMail function.

        return {
            "success": True,
            "data": {"expiredCount": len(expired)},
        }

    except Exception as e:
        logging.exception("expire_job_postings failed")
        return {"success": False, "error": str(e)}
