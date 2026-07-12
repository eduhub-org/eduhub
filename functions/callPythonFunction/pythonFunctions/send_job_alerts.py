import html
import logging
import os
from datetime import datetime, timedelta, timezone

from api_clients import EduHubClient

from pythonFunctions.expire_job_postings import _get_mail_template, _queue_mail

MAX_POSTINGS_PER_MAIL = 10

# Same widened region semantics as the website search (frontend lib/jobs.ts,
# from Rails "region <= param"): broad regions include the local ones.
REGION_WIDENING = {
    "SCHLESWIG_HOLSTEIN_HAMBURG": ["FLENSBURG", "KIEL", "SCHLESWIG_HOLSTEIN_HAMBURG"],
    "GERMANY": ["FLENSBURG", "KIEL", "SCHLESWIG_HOLSTEIN_HAMBURG", "GERMANY"],
}


def send_job_alerts(arguments):
    """
    Weekly StuJo job alert ("Job-Letter"), run by the send_job_alerts cron
    trigger (Mondays 06:00). For every active JobAlertSubscription it
    collects the postings published since the last send (bounded to 7 days
    for first-time sends), applies the optional type/region filters and
    queues one mail via MailLog (template JOB_ALERT).

    Args:
        arguments (dict): Cron payload (unused)

    Returns:
        dict: success flag plus counts of processed subscriptions and mails
    """
    logging.info("########## Send Job Alerts Function ##########")

    try:
        client = EduHubClient()
        now = datetime.now(timezone.utc)
        frontend_url = os.environ.get("STUJO_FRONTEND_URL") or os.environ.get("FRONTEND_URL") or ""

        subs_query = """
        query GetActiveJobAlertSubscriptions {
            JobAlertSubscription(where: {active: {_eq: true}}) {
                id
                userId
                jobPostingType
                region
                lastSentAt
                User {
                    email
                }
            }
        }
        """
        result = client.send_query(subs_query, {})
        if not isinstance(result, dict) or result.get("errors"):
            logging.error(f"Could not load subscriptions: {result}")
            return {"success": False, "error": str(result)}
        subscriptions = result["data"]["JobAlertSubscription"]

        template = _get_mail_template(client, "JOB_ALERT")
        if not template:
            return {"success": False, "error": "JOB_ALERT mail template missing"}

        postings_query = """
        query GetNewPostings($since: timestamptz!) {
            JobPosting(
                where: {status: {_eq: PUBLISHED}, publishedAt: {_gte: $since}},
                order_by: {publishedAt: desc}
            ) {
                id
                title
                type
                region
                location
                Organization {
                    name
                }
            }
        }
        """

        update_sub = """
        mutation MarkJobAlertSent($id: Int!, $now: timestamptz!) {
            update_JobAlertSubscription_by_pk(pk_columns: {id: $id}, _set: {lastSentAt: $now}) {
                id
            }
        }
        """

        mailed = 0
        for sub in subscriptions:
            email = (sub.get("User") or {}).get("email")
            if not email:
                continue

            last_sent = sub.get("lastSentAt")
            since = last_sent or (now - timedelta(days=7)).isoformat()
            postings_result = client.send_query(postings_query, {"since": since})
            if not isinstance(postings_result, dict) or postings_result.get("errors"):
                logging.warning(f"Posting query failed for subscription {sub['id']}: {postings_result}")
                continue
            postings = postings_result["data"]["JobPosting"]

            if sub.get("jobPostingType"):
                postings = [p for p in postings if p["type"] == sub["jobPostingType"]]
            if sub.get("region"):
                matching_regions = REGION_WIDENING.get(sub["region"], [sub["region"]])
                postings = [p for p in postings if p["region"] in matching_regions]
            if not postings:
                continue

            items = []
            for posting in postings[:MAX_POSTINGS_PER_MAIL]:
                title = html.escape(posting["title"])
                org = html.escape((posting.get("Organization") or {}).get("name") or "")
                location = html.escape(posting.get("location") or "")
                meta = " · ".join(filter(None, [org, location]))
                items.append(
                    f'<li><a href="{frontend_url}/stellenangebote/{posting["id"]}">{title}</a>'
                    f'{f" – {meta}" if meta else ""}</li>'
                )
            listing = "<ul>" + "".join(items) + "</ul>"
            if len(postings) > MAX_POSTINGS_PER_MAIL:
                listing += f"<p>… und {len(postings) - MAX_POSTINGS_PER_MAIL} weitere.</p>"

            variables = {
                "[JobAlert:List]": listing,
                "[JobAlert:AllJobsUrl]": f"{frontend_url}/stellenangebote",
                "[JobAlert:UnsubscribeUrl]": f"{frontend_url}/job-letter",
            }
            if _queue_mail(client, template, email, variables):
                mailed += 1
                client.send_query(update_sub, {"id": sub["id"], "now": now.isoformat()})

        logging.info(f"Job alerts: {len(subscriptions)} subscriptions, {mailed} mails queued")
        return {"success": True, "data": {"subscriptions": len(subscriptions), "mailed": mailed}}

    except Exception as e:
        logging.exception("send_job_alerts failed")
        return {"success": False, "error": str(e)}
