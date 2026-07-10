#!/usr/bin/env python3
"""StuJo → EduHub data migration (phase 2 of docs/STUJO_INTEGRATION_PLAN.md).

Reads a snapshot of the StuJo Rails **MySQL** database and writes companies,
employer accounts, job postings and credits into EduHub (Hasura/Postgres +
Keycloak + GCS). Idempotent: re-running only inserts what is missing
(matched via JobPosting.legacyStujoId, Organization.aliases and user email),
so it can be re-run for delta syncs before cutover.

Usage:
    python3 stujo_etl.py --dry-run            # report what would happen
    python3 stujo_etl.py --steps companies,users,jobs,credits

Environment:
    STUJO_MYSQL_DSN        e.g. mysql://user:pass@host:3306/stujo
    STUJO_FILES_ROOT       path to the Rails public/ dir (Paperclip files)
    HASURA_URL             e.g. https://.../v1/graphql
    HASURA_ADMIN_SECRET
    KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_ADMIN_USER, KEYCLOAK_ADMIN_PASSWORD
    GCS_BUCKET             target bucket for logos and job PDFs
    RETENTION_YEARS        only migrate companies with a posting newer than
                           this many years (default 3; see plan §7/§9)

Dependencies: mysql-connector-python, requests, google-cloud-storage,
python-keycloak (or plain requests against the Keycloak Admin API).
"""

import argparse
import json
import logging
import os
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("stujo-etl")

# ---------------------------------------------------------------------------
# Static mappings (validated against the Rails source, see plan §2/§5)
# ---------------------------------------------------------------------------

# Rails categories(id) → JobPostingType. Seeds create a "----" placeholder as
# id 1; verify the ids against the production dump before the first run.
CATEGORY_TO_TYPE = {
    2: "MINIJOB",
    3: "WORKING_STUDENT",
    4: "INTERNSHIP",
    5: "THESIS",
    6: "PERMANENT",
    7: "TRAINEE",
    8: "STATE_RECOGNITION_INTERNSHIP",
}

# Rails jobs.region int → JobRegion (app/helpers/jobs_helper.rb)
REGION_TO_ENUM = {
    -2: "FLENSBURG",
    0: "KIEL",
    1: "SCHLESWIG_HOLSTEIN_HAMBURG",
    2: "GERMANY",
    3: "DENMARK",
    4: "ABROAD",
}

# Rails jobs.status int (app/helpers/studio_helper.rb):
# 0 DELETED (skip), 1 ARCHIVE, 2 ACTIVE, 3 FEATURED
STATUS_ARCHIVE, STATUS_ACTIVE, STATUS_FEATURED = 1, 2, 3

# Rails occupations.name → JobOccupation (seeded by migration
# 1783583081553_create_table_public_JobOccupation). Names must match the
# production occupations table; unknown names fall back to OTHER.
OCCUPATION_TO_ENUM = {
    "Administration und Sachbearbeitung": "ADMINISTRATION",
    "Aus- und Weiterbildung": "EDUCATION_TRAINING",
    "Banken, Versicherungen und Finanzdienstleistungen": "BANKING_INSURANCE",
    "Customer Service und Kundenbetreuung": "CUSTOMER_SERVICE",
    "Design, Gestaltung und Architektur": "DESIGN_ARCHITECTURE",
    "Einkauf, Transport und Logistik": "PURCHASING_LOGISTICS",
    "Fertigung, Bau und Handwerk": "MANUFACTURING_CONSTRUCTION",
    "Finanz- und Rechnungswesen": "ACCOUNTING",
    "Forschung, Entwicklung und Wissenschaft": "RESEARCH_SCIENCE",
    "Gesundheit, Medizin und Soziales": "HEALTH_SOCIAL",
    "Hotel und Gastronomie": "HOSPITALITY",
    "Ingenieurwesen und technische Berufe": "ENGINEERING",
    "Instandhaltung": "MAINTENANCE",
    "IT und Telekommunikation": "IT_TELECOMMUNICATIONS",
    "Kunst und Kultur": "ARTS_CULTURE",
    "Land-, Forst-, Fischwirtschaft und Umwelt": "AGRICULTURE_ENVIRONMENT",
    "Marketing und Werbung": "MARKETING_ADVERTISING",
    "Öffentlicher Dienst und Verbände": "PUBLIC_SERVICE",
    "Personalwesen": "HUMAN_RESOURCES",
    "Produktion": "PRODUCTION",
    "Projektmanagement": "PROJECT_MANAGEMENT",
    "Qualitätswesen": "QUALITY_MANAGEMENT",
    "Recht": "LEGAL",
    "Redaktion, Medien und Information": "MEDIA_EDITORIAL",
    "Sicherheit und Zivilschutz": "SECURITY_CIVIL_PROTECTION",
    "Unternehmensführung / Geschäftsleitung": "MANAGEMENT",
    "Vertrieb und Handel": "SALES_RETAIL",
    "Sonstiges Berufsfeld": "OTHER",
    # Added in production after the original seeds (validated against the
    # 2026-07-10 dump; enum values from insert_into_public_JobOccupation_prod_additions)
    "Tourismus": "TOURISM",
    "Event Management": "EVENT_MANAGEMENT",
    "Unternehmensberatung": "CONSULTING",
    "Immobilien": "REAL_ESTATE",
    "Social Media": "SOCIAL_MEDIA",
    "Sozialpädagogik": "SOCIAL_PEDAGOGY",
}

PUBLICATION_DAYS = 56  # 8 weeks, parity with Job.archiveoldjobs

SITE_STUJO, SITE_ETALENTS = 0, 1  # sitememberships.site


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value


def normalize_company_name(name: str) -> str:
    """Normalization for dedupe against existing EduHub organizations."""
    n = name.lower().strip()
    n = re.sub(r"\b(gmbh & co\.? kg|gmbh|ag|kg|e\.?v\.?|ug|se|ohg|mbh)\b", "", n)
    return re.sub(r"[^a-z0-9]+", "", n)


class HasuraClient:
    def __init__(self, url: str, admin_secret: str, dry_run: bool):
        self.url = url
        self.admin_secret = admin_secret
        self.dry_run = dry_run

    def query(self, query: str, variables: dict | None = None):
        import requests

        r = requests.post(
            self.url,
            json={"query": query, "variables": variables or {}},
            headers={"x-hasura-admin-secret": self.admin_secret},
            timeout=60,
        )
        r.raise_for_status()
        body = r.json()
        if body.get("errors"):
            raise RuntimeError(f"GraphQL error: {body['errors']}")
        return body["data"]

    def mutate(self, query: str, variables: dict | None = None):
        if self.dry_run:
            log.info("[dry-run] mutation skipped: %s", query.strip().splitlines()[0])
            return None
        return self.query(query, variables)


# ---------------------------------------------------------------------------
# Extract
# ---------------------------------------------------------------------------

def mysql_connection(dsn: str):
    import mysql.connector
    from urllib.parse import urlparse

    u = urlparse(dsn)
    return mysql.connector.connect(
        host=u.hostname,
        port=u.port or 3306,
        user=u.username,
        password=u.password,
        database=u.path.lstrip("/"),
        charset="utf8mb4",
    )


def fetch_all(cnx, sql: str, params=()):
    cur = cnx.cursor(dictionary=True)
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    return rows


def load_source(cnx, retention_years: int):
    """Load the relevant slice of the Rails DB into memory.

    Scope rules (plan §7.1):
    - skip pure e-talents companies/people (sitememberships.site = 1 only)
    - only companies with a posting newer than the retention window
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=365 * retention_years)

    companies = fetch_all(
        cnx,
        """
        SELECT DISTINCT c.*, a.street, a.nr, a.zip, a.location AS city,
               a.country, i.name AS industry
        FROM companies c
        LEFT JOIN addresses a ON a.id = c.address_id
        LEFT JOIN industries i ON i.id = c.industry_id
        JOIN contacts ct ON ct.company_id = c.id
        JOIN jobs j ON j.contact_id = ct.id
        WHERE j.created_at >= %s AND j.status > 0
        """,
        (cutoff,),
    )
    company_ids = [c["id"] for c in companies]
    log.info("companies in scope (retention %sy): %s", retention_years, len(company_ids))
    if not company_ids:
        return {"companies": [], "contacts": [], "jobs": [], "counters": []}

    fmt = ",".join(["%s"] * len(company_ids))
    contacts = fetch_all(
        cnx,
        f"""
        SELECT ct.id, ct.company_id, p.id AS person_id, p.email, p.forname,
               p.name, p.password_hash, p.password_salt,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id AND sm.site = {SITE_ETALENTS}) AS etalents,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id AND sm.site = {SITE_STUJO}) AS stujo,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id) AS memberships
        FROM contacts ct JOIN people p ON p.id = ct.person_id
        WHERE ct.company_id IN ({fmt})
        """,
        company_ids,
    )
    # is_stujo_person? semantics: no memberships at all OR an explicit stujo one
    contacts = [c for c in contacts if c["memberships"] == 0 or c["stujo"] > 0]

    jobs = fetch_all(
        cnx,
        f"""
        SELECT j.*, ct.company_id, cat.name AS category_name,
               o.name AS occupation_name,
               (SELECT GROUP_CONCAT(t.name SEPARATOR '|||') FROM tags t
                 WHERE t.job_id = j.id) AS tag_names,
               (SELECT GROUP_CONCAT(m.name SEPARATOR '|||')
                  FROM restrictions r JOIN mandates m ON m.id = r.mandate_id
                 WHERE r.job_id = j.id) AS mandate_names
        FROM jobs j
        JOIN contacts ct ON ct.id = j.contact_id
        LEFT JOIN categories cat ON cat.id = j.category_id
        LEFT JOIN occupations o ON o.id = j.occupation_id
        WHERE ct.company_id IN ({fmt}) AND j.status > 0
        """,
        company_ids,
    )

    counters = fetch_all(
        cnx,
        f"SELECT * FROM paymentcounters WHERE company_id IN ({fmt})",
        company_ids,
    )

    return {"companies": companies, "contacts": contacts, "jobs": jobs, "counters": counters}


# ---------------------------------------------------------------------------
# Load steps (each idempotent)
# ---------------------------------------------------------------------------

def step_companies(hasura: HasuraClient, gcs_bucket, files_root, companies) -> dict:
    """Companies → Organization (CORPORATION). Returns rails_id → org_id."""
    existing = hasura.query(
        """query { Organization { id name aliases } }"""
    )["Organization"]
    by_norm = {normalize_company_name(o["name"]): o for o in existing}
    by_alias = {}
    for o in existing:
        for alias in o.get("aliases") or []:
            by_alias[alias] = o

    mapping = {}
    for c in companies:
        legacy_alias = f"stujo:{c['id']}-{slugify(c['name'])}"
        org = by_alias.get(legacy_alias) or by_norm.get(normalize_company_name(c["name"]))
        if org:
            mapping[c["id"]] = org["id"]
            log.info("company %s → existing Organization %s (%s)", c["id"], org["id"], org["name"])
            continue

        logo_url = copy_paperclip_logo(gcs_bucket, files_root, c)
        address_line = " ".join(filter(None, [c.get("street"), c.get("nr")])) or None
        result = hasura.mutate(
            """
            mutation ($obj: Organization_insert_input!) {
              insert_Organization_one(object: $obj) { id }
            }
            """,
            {
                "obj": {
                    "name": c["name"],
                    "type": "CORPORATION",
                    "description": c.get("description"),
                    "website": c.get("url"),
                    "logo": logo_url,
                    "addressLine1": address_line,
                    "postalCode": c.get("zip"),
                    "city": c.get("city"),
                    "aliases": [legacy_alias],
                }
            },
        )
        org_id = result["insert_Organization_one"]["id"] if result else -c["id"]
        mapping[c["id"]] = org_id
        log.info("company %s '%s' → new Organization %s", c["id"], c["name"], org_id)
    return mapping


def copy_paperclip_logo(gcs_bucket, files_root, company) -> str | None:
    """Copy public/system/logos/:id/original/:filename to GCS."""
    if not company.get("logo_file_name") or gcs_bucket is None:
        return None
    src = os.path.join(
        files_root, "system", "logos", str(company["id"]), "original",
        company["logo_file_name"],
    )
    if not os.path.exists(src):
        log.warning("logo missing on disk: %s", src)
        return None
    blob_name = f"stujo/logos/{company['id']}/{company['logo_file_name']}"
    blob = gcs_bucket.blob(blob_name)
    blob.upload_from_filename(src)
    return f"https://storage.googleapis.com/{gcs_bucket.name}/{blob_name}"


def copy_paperclip_pdf(gcs_bucket, files_root, job) -> str | None:
    """Copy the Paperclip job PDF (default id_partition path) to GCS."""
    if not job.get("pdf_file_name") or gcs_bucket is None:
        return None
    id_partition = "/".join(re.findall("...", f"{job['id']:09d}"))
    src = os.path.join(
        files_root, "system", "jobs", "pdfs", id_partition, "original",
        job["pdf_file_name"],
    )
    if not os.path.exists(src):
        log.warning("job pdf missing on disk: %s", src)
        return None
    blob_name = f"stujo/job-pdfs/{job['id']}/{job['pdf_file_name']}"
    blob = gcs_bucket.blob(blob_name)
    blob.upload_from_filename(src)
    return f"https://storage.googleapis.com/{gcs_bucket.name}/{blob_name}"


def step_users(hasura: HasuraClient, keycloak, contacts, org_mapping):
    """Employer accounts → Keycloak (bcrypt import) + User + OrganizationAdmin.

    The Keycloak instance has the bcrypt password-hash extension, so the
    Rails bcrypt hashes are imported as credentials and passwords keep
    working. Users are matched by email first (many employers already have
    EduHub accounts).
    """
    for c in contacts:
        email = (c.get("email") or "").strip().lower()
        if not email or c["company_id"] not in org_mapping:
            continue
        org_id = org_mapping[c["company_id"]]

        existing = hasura.query(
            """query ($email: String!) { User(where: {email: {_ilike: $email}}) { id } }""",
            {"email": email},
        )["User"]

        if existing:
            user_id = existing[0]["id"]
        else:
            if keycloak is None:
                log.info("[dry-run] would create Keycloak user %s (bcrypt import)", email)
                continue
            user_id = keycloak.create_user_with_bcrypt(
                email=email,
                first_name=c.get("forname") or "",
                last_name=c.get("name") or "",
                bcrypt_hash=c.get("password_hash"),
            )
            # The updateFromKeycloak event/function mirrors the user into the
            # User table; poll or upsert directly depending on environment.

        # OrganizationAdmin has no unique(userId, organizationId) constraint,
        # so idempotency is check-then-insert.
        grant = hasura.query(
            """
            query ($userId: uuid!, $orgId: Int!) {
              OrganizationAdmin(where: {userId: {_eq: $userId}, organizationId: {_eq: $orgId}}) { id canManageJobs }
            }
            """,
            {"userId": user_id, "orgId": org_id},
        )["OrganizationAdmin"]
        if grant:
            if not grant[0]["canManageJobs"]:
                hasura.mutate(
                    """
                    mutation ($id: Int!) {
                      update_OrganizationAdmin_by_pk(pk_columns: {id: $id}, _set: {canManageJobs: true}) { id }
                    }
                    """,
                    {"id": grant[0]["id"]},
                )
        else:
            hasura.mutate(
                """
                mutation ($obj: OrganizationAdmin_insert_input!) {
                  insert_OrganizationAdmin_one(object: $obj) { id }
                }
                """,
                {"obj": {"userId": user_id, "organizationId": org_id, "canManageJobs": True}},
            )
        log.info("contact %s (%s) → OrganizationAdmin of org %s", c["id"], email, org_id)


def step_jobs(hasura: HasuraClient, gcs_bucket, files_root, jobs, org_mapping, haw_org_id):
    """jobs → JobPosting (+ tags). Idempotent via legacyStujoId."""
    existing = {
        row["legacyStujoId"]
        for row in hasura.query(
            "query { JobPosting(where: {legacyStujoId: {_is_null: false}}) { legacyStujoId } }"
        )["JobPosting"]
    }

    for j in jobs:
        if j["id"] in existing or j["company_id"] not in org_mapping:
            continue
        posting_type = CATEGORY_TO_TYPE.get(j["category_id"])
        if posting_type is None:
            log.warning("job %s: unknown category %s — skipped", j["id"], j["category_id"])
            continue

        published = j["status"] in (STATUS_ACTIVE, STATUS_FEATURED)
        created = j["created_at"]
        expires = (created + timedelta(days=PUBLICATION_DAYS)) if created else None
        if j.get("recurring") and published:
            # Evergreen postings get one fresh full window and are reported
            # for the manual pricing conversation (plan §1.4/§9).
            expires = datetime.now(timezone.utc) + timedelta(days=PUBLICATION_DAYS)
            log.warning("job %s '%s' is recurring — fresh window, needs follow-up", j["id"], j["title"])

        restricted_to = None
        if j.get("mandate_names"):
            # Production data (2026-07-10): HAW-Kiel restricts 36 jobs, ZfS
            # restricts a single old one; other mandates restrict nothing.
            names = j["mandate_names"]
            if "HAW" in names:
                restricted_to = haw_org_id
                if haw_org_id is None:
                    log.warning("job %s restricted to HAW but --haw-org-id not set", j["id"])
            else:
                log.warning("job %s has non-HAW mandates (%s) — imported unrestricted, review manually", j["id"], names)

        duration_text = " ".join(
            filter(None, [str(j.get("duration") or "").strip(), (j.get("duration_unit") or "").strip()])
        ) or None
        tags = [t for t in (j.get("tag_names") or "").split("|||") if t]

        hasura.mutate(
            """
            mutation ($obj: JobPosting_insert_input!) {
              insert_JobPosting_one(object: $obj) { id }
            }
            """,
            {
                "obj": {
                    "legacyStujoId": j["id"],
                    "organizationId": org_mapping[j["company_id"]],
                    "slug": f"{j['id']}-{slugify(j['title'])}",
                    "type": posting_type,
                    "status": "PUBLISHED" if published else "ARCHIVED",
                    "featured": j["status"] == STATUS_FEATURED,
                    "region": REGION_TO_ENUM.get(j.get("region")),
                    "occupation": OCCUPATION_TO_ENUM.get(j.get("occupation_name"), "OTHER"),
                    "title": j["title"],
                    "description": j.get("description"),
                    "shortDescription": j.get("shortdescription"),
                    "requirement": j.get("requirement"),
                    "location": j.get("location"),
                    "salaryText": j.get("payment"),
                    "startText": j.get("entry"),
                    "durationText": duration_text,
                    "applicationDeadline": j["closingdate"].date().isoformat() if j.get("closingdate") else None,
                    "workExperienceRequired": bool(j.get("work_experience")),
                    "hoursPerWeek": j.get("working_time"),
                    "language": j.get("language"),
                    "international": bool(j.get("international")),
                    "internationalDescription": j.get("international_description"),
                    "customCompany": j.get("custom_Company"),
                    "pdfUrl": copy_paperclip_pdf(gcs_bucket, files_root, j),
                    "views": j.get("views") or 0,
                    "restrictedToOrganizationId": restricted_to,
                    "publishedAt": created.isoformat() if (published and created) else None,
                    "expiresAt": expires.isoformat() if (published and expires) else None,
                    "JobPostingTags": {"data": [{"name": t} for t in tags]},
                }
            },
        )
        log.info("job %s '%s' → JobPosting (%s)", j["id"], j["title"], "PUBLISHED" if published else "ARCHIVED")


def step_credits(hasura: HasuraClient, counters, org_mapping):
    """Remaining paymentcounters credits → JobPostingCredit (untyped)."""
    for pc in counters:
        org_id = org_mapping.get(pc["company_id"])
        # Rails uses `job` as the generic free-posting counter in the current
        # flow (free == "promo" decrements it); -1 means unlimited legacy tier.
        remaining = pc.get("job") or 0
        if org_id is None or remaining <= 0:
            continue
        hasura.mutate(
            """
            mutation ($obj: JobPostingCredit_insert_input!) {
              insert_JobPostingCredit_one(
                object: $obj,
                on_conflict: {
                  constraint: JobPostingCredit_organizationId_jobPostingType_key,
                  update_columns: []
                }
              ) { id }
            }
            """,
            {"obj": {"organizationId": org_id, "jobPostingType": None, "remaining": remaining}},
        )
        log.info("paymentcounter %s → %s credit(s) for org %s", pc["id"], remaining, org_id)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="no writes, log intent only")
    parser.add_argument("--steps", default="companies,users,jobs,credits")
    parser.add_argument("--haw-org-id", type=int, default=None,
                        help="Organization.id of HAW Kiel (mandate restriction target)")
    parser.add_argument("--retention-years", type=int,
                        default=int(os.environ.get("RETENTION_YEARS", "3")))
    args = parser.parse_args()
    steps = set(args.steps.split(","))

    dsn = os.environ.get("STUJO_MYSQL_DSN")
    hasura_url = os.environ.get("HASURA_URL")
    admin_secret = os.environ.get("HASURA_ADMIN_SECRET")
    files_root = os.environ.get("STUJO_FILES_ROOT", "")
    if not dsn or not hasura_url or not admin_secret:
        log.error("STUJO_MYSQL_DSN, HASURA_URL and HASURA_ADMIN_SECRET are required")
        sys.exit(2)

    gcs_bucket = None
    if os.environ.get("GCS_BUCKET") and not args.dry_run:
        from google.cloud import storage

        gcs_bucket = storage.Client().bucket(os.environ["GCS_BUCKET"])

    keycloak = None  # wire python-keycloak here for the real run (see step_users)

    hasura = HasuraClient(hasura_url, admin_secret, args.dry_run)
    cnx = mysql_connection(dsn)
    src = load_source(cnx, args.retention_years)
    log.info(
        "loaded: %s companies, %s contacts, %s jobs, %s counters",
        len(src["companies"]), len(src["contacts"]), len(src["jobs"]), len(src["counters"]),
    )

    org_mapping = {}
    if "companies" in steps:
        org_mapping = step_companies(hasura, gcs_bucket, files_root, src["companies"])
    if "users" in steps:
        step_users(hasura, keycloak, src["contacts"], org_mapping)
    if "jobs" in steps:
        step_jobs(hasura, gcs_bucket, files_root, src["jobs"], org_mapping, args.haw_org_id)
    if "credits" in steps:
        step_credits(hasura, src["counters"], org_mapping)

    log.info("done%s", " (dry run)" if args.dry_run else "")


if __name__ == "__main__":
    main()
