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
    STUJO_FILES_ROOT       path to the Rails public/ dir (Paperclip files);
                           required for real companies/jobs runs
    HASURA_URL             e.g. https://.../v1/graphql
    HASURA_ADMIN_SECRET
    KEYCLOAK_URL, KEYCLOAK_USER, KEYCLOAK_PW   (admin credentials; same names
                           the functions use in docker-compose.yml)
    KEYCLOAK_REALM         target realm (default: edu-hub)
    GCS_BUCKET             target bucket for logos and job PDFs;
                           required for real companies/jobs runs
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

# JobPostingCredit has no "unlimited" flag or free-text column, so the legacy
# "-1 = unlimited" paymentcounter tier is imported as a sentinel amount that
# no employer will realistically exhaust (flagged with a warning per org).
UNLIMITED_CREDITS_SENTINEL = 100000

SITE_STUJO, SITE_ETALENTS = 0, 1  # sitememberships.site

# Paperclip file-copy accounting, reported at the end of the run so "did all
# PDFs/logos make it?" is answerable without grepping the per-file warnings.
FILE_STATS = {
    "logos_copied": 0,
    "logos_missing": 0,
    "pdfs_copied": 0,
    "pdfs_missing": 0,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value


def normalize_company_name(name: str) -> str:
    """Normalization for dedupe against existing EduHub organizations.

    Returns "" for a name that carries no dedupe signal at all — a punctuation-
    only row ("-", "..."), or one that is nothing but a legal form ("e.V."),
    since both the legal forms and every non-alphanumeric character are
    stripped. Callers MUST NOT dedupe on an empty result: it matches every other
    junk-named company, which is how a StuJo company merged into the placeholder
    Organization "-" and made its contact an admin there.
    """
    n = name.lower().strip()
    n = re.sub(r"\b(gmbh & co\.? kg|gmbh|ag|kg|e\.?v\.?|ug|se|ohg|mbh)\b", "", n)
    return re.sub(r"[^a-z0-9]+", "", n)


_LIKE_WILDCARDS = re.compile(r"([\\%_])")


def like_escape(value: str) -> str:
    """Escape the LIKE/ILIKE wildcards in a value used as a pattern.

    Legacy addresses regularly contain "_", which ILIKE reads as "any single
    character": an unescaped lookup for `max_mustermann@x.de` also matches
    `max.mustermann@x.de`, so a StuJo grant could land on a different person.
    Postgres uses backslash as the default LIKE escape character.
    """
    return _LIKE_WILDCARDS.sub(r"\\\1", value)


def mask_email(email: str | None) -> str:
    """PII-safe log representation (first character + domain only)."""
    local, _, domain = (email or "").partition("@")
    return f"{local[:1]}***@{domain}" if domain else "***"


def normalize_website(url: str | None) -> str | None:
    """Rails companies.url is free text; bare domains ('www.foo.de') become
    https:// links and anything that is not http(s) after that is dropped —
    the job detail page only renders http(s) hrefs (XSS review finding)."""
    u = (url or "").strip()
    if not u:
        return None
    if re.match(r"^https?://", u, re.I):
        return u
    if re.match(r"^[\w.-]+\.[a-z]{2,}([/?#].*)?$", u, re.I):
        return f"https://{u}"
    log.warning("dropping non-http(s) company website %r", u)
    return None


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


# Keycloak's default person-name validator (person-name-prohibited-characters)
# rejects names containing any of these characters, so ~700 legacy contacts with
# a comma / underscore / & / … in their forename or surname would fail to import
# even though their email and bcrypt password are perfectly valid. Scrub the name
# down to the allowed set (mirroring Keycloak's default prohibited list plus
# control chars) rather than drop an otherwise-importable account.
_NAME_PROHIBITED_RE = re.compile(r'[<>&"$%!#?§,*_={}\\/\x00-\x1f]')


def sanitize_person_name(name: str | None) -> str:
    if not name:
        return ""
    cleaned = _NAME_PROHIBITED_RE.sub(" ", name)
    return re.sub(r"\s+", " ", cleaned).strip()


class KeycloakClient:
    """Minimal Keycloak Admin REST client (admin-cli password grant).

    The Keycloak image ships the bcrypt password-hash SPI
    (keycloak/libs/keycloak-bcrypt-1.6.0.jar, provider id "bcrypt"), so Rails
    `people.password_hash` values import directly as credentials and the
    legacy passwords keep working after migration.
    """

    def __init__(self, url: str, realm: str, admin_user: str, admin_password: str):
        import requests

        self.url = url.rstrip("/")
        self.realm = realm
        self.admin_user = admin_user
        self.admin_password = admin_password
        self.session = requests.Session()
        self._authenticate()  # fail loudly up front if unreachable/misconfigured

    def _authenticate(self):
        r = self.session.post(
            f"{self.url}/realms/master/protocol/openid-connect/token",
            data={
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": self.admin_user,
                "password": self.admin_password,
            },
            timeout=30,
        )
        r.raise_for_status()
        self.session.headers["Authorization"] = f"Bearer {r.json()['access_token']}"

    def _request(self, method: str, path: str, **kwargs):
        url = f"{self.url}/admin/realms/{self.realm}{path}"
        r = self.session.request(method, url, timeout=30, **kwargs)
        if r.status_code == 401:  # admin token expired mid-run — re-auth once
            self._authenticate()
            r = self.session.request(method, url, timeout=30, **kwargs)
        return r

    def create_user_with_bcrypt(self, email: str, first_name: str, last_name: str,
                                bcrypt_hash: str | None) -> str:
        """Create the user (idempotent: 409 → look up the existing one) with
        the legacy bcrypt hash imported as password credential. Returns the
        Keycloak user id (uuid), which doubles as the EduHub User.id."""
        payload = {
            "username": email,
            "email": email,
            "firstName": sanitize_person_name(first_name),
            "lastName": sanitize_person_name(last_name),
            "enabled": True,
            "emailVerified": True,
        }
        cost = re.match(r"^\$2[abxy]?\$(\d+)\$", bcrypt_hash or "")
        if cost:
            payload["credentials"] = [{
                "type": "password",
                "secretData": json.dumps({"value": bcrypt_hash}),
                "credentialData": json.dumps(
                    {"algorithm": "bcrypt", "hashIterations": int(cost.group(1))}
                ),
            }]
        else:
            log.warning("user %s: no importable bcrypt hash — created without "
                        "password (needs the reset flow)", mask_email(email))
        r = self._request("POST", "/users", json=payload)
        if r.status_code == 201:
            return r.headers["Location"].rstrip("/").split("/")[-1]
        if r.status_code == 409:
            lookup = self._request("GET", "/users", params={"email": email, "exact": "true"})
            lookup.raise_for_status()
            matches = lookup.json()
            if matches:
                log.info("Keycloak user %s already exists (%s)",
                         mask_email(email), matches[0]["id"])
                return matches[0]["id"]
        raise RuntimeError(
            f"Keycloak user create failed for {mask_email(email)}: "
            f"{r.status_code} {r.text[:300]}"
        )

    def grant_client_role(self, user_id: str, role_name: str, client_id: str = "hasura"):
        """Grant a client role (e.g. hasura/org_admin) to a user. Employers
        need `org_admin` in x-hasura-allowed-roles for the Mein-StuJo
        dashboard; without it Hasura rejects the role elevation. Adding an
        already-assigned role is a no-op in Keycloak, so this is idempotent."""
        if not hasattr(self, "_client_uuids"):
            self._client_uuids = {}
            self._role_reps = {}
        if client_id not in self._client_uuids:
            r = self._request("GET", "/clients", params={"clientId": client_id})
            r.raise_for_status()
            self._client_uuids[client_id] = r.json()[0]["id"]
        client_uuid = self._client_uuids[client_id]
        role_key = (client_id, role_name)
        if role_key not in self._role_reps:
            r = self._request("GET", f"/clients/{client_uuid}/roles/{role_name}")
            r.raise_for_status()
            self._role_reps[role_key] = r.json()
        r = self._request(
            "POST",
            f"/users/{user_id}/role-mappings/clients/{client_uuid}",
            json=[self._role_reps[role_key]],
        )
        if r.status_code not in (204, 409):
            raise RuntimeError(
                f"Granting {client_id}/{role_name} to {user_id} failed: "
                f"{r.status_code} {r.text[:300]}"
            )


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


# Disposable / fake email domains found in the StuJo data (staging spam
# analysis 2026-07-17): bot signups cluster on these. Students on such a domain
# are dropped by default (see is_migratable_email / --keep-junk-students).
DISPOSABLE_EMAIL_DOMAINS = {
    "example.com", "immenseignite.info", "testform.xyz", "solid-hamster.skin",
    "swooflia.cc", "advoter.cc", "bestmailonline.com", "mail.ru",
}


def is_migratable_email(email) -> bool:
    """True for a plausibly-real, non-disposable address. Filters out the bot
    signups (invalid strings like 'sdgsdg', fake/disposable domains)."""
    if not email:
        return False
    email = email.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return False
    return email.rsplit("@", 1)[-1] not in DISPOSABLE_EMAIL_DOMAINS


def load_source(cnx, retention_years=None, only_with_jobs=True,
                drop_junk_students=True):
    """Load the relevant slice of the Rails DB into memory.

    Scope rules:
    - skip pure e-talents companies/people (sitememberships.site = 1 only)
    - only_with_jobs (default, decision 2026-07-17): drop companies that never
      posted an active job — ~65% of StuJo companies never did, and that group
      is where the spam concentrates. --include-jobless-companies keeps them.
    - drop_junk_students (default, decision 2026-07-17): drop students whose
      email is invalid or on a disposable/fake domain. --keep-junk-students
      keeps them.
    - retention_years is an opt-in date restriction for test runs.
    """
    if retention_years:
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
    else:
        companies = fetch_all(
            cnx,
            """
            SELECT c.*, a.street, a.nr, a.zip, a.location AS city,
                   a.country, i.name AS industry
            FROM companies c
            LEFT JOIN addresses a ON a.id = c.address_id
            LEFT JOIN industries i ON i.id = c.industry_id
            """,
        )
    # Skip pure e-talents companies: keep only companies with at least one
    # StuJo contact person (same is_stujo_person? rule as the contacts filter
    # below: no sitememberships at all OR an explicit stujo one). Companies
    # without any contact drop out too — they carry no users and no jobs.
    stujo_company_ids = {
        row["company_id"]
        for row in fetch_all(
            cnx,
            f"""
            SELECT DISTINCT ct.company_id
            FROM contacts ct JOIN people p ON p.id = ct.person_id
            WHERE NOT EXISTS (SELECT 1 FROM sitememberships sm
                               WHERE sm.person_id = p.id)
               OR EXISTS (SELECT 1 FROM sitememberships sm
                           WHERE sm.person_id = p.id AND sm.site = {SITE_STUJO})
            """,
        )
    }
    before = len(companies)
    companies = [c for c in companies if c["id"] in stujo_company_ids]
    if before != len(companies):
        log.info("skipped %s companies without a StuJo contact (pure e-talents or contactless)",
                 before - len(companies))

    if only_with_jobs:
        # Keep only companies with at least one active (status>0) job posting —
        # the ~65% that never posted are inactive shells / spam signups.
        with_active_job = {
            row["company_id"]
            for row in fetch_all(
                cnx,
                "SELECT DISTINCT ct.company_id FROM jobs j "
                "JOIN contacts ct ON ct.id = j.contact_id WHERE j.status > 0",
            )
        }
        before = len(companies)
        companies = [c for c in companies if c["id"] in with_active_job]
        log.info("only-with-jobs filter: dropped %s companies with no active job posting",
                 before - len(companies))

    company_ids = [c["id"] for c in companies]
    log.info(
        "companies in scope (retention %s): %s",
        f"{retention_years}y" if retention_years else "all",
        len(company_ids),
    )
    if not company_ids:
        return {"companies": [], "contacts": [], "jobs": [], "counters": [], "students": []}

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

    # Students (business decision 2026-07-11: migrate all, dedupe by email)
    # incl. saved jobs and the old job-letter config.
    students = fetch_all(
        cnx,
        f"""
        SELECT s.id AS student_id, p.id AS person_id, p.email, p.forname,
               p.name, p.password_hash,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id AND sm.site = {SITE_ETALENTS}) AS etalents,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id AND sm.site = {SITE_STUJO}) AS stujo,
               (SELECT COUNT(*) FROM sitememberships sm
                 WHERE sm.person_id = p.id) AS memberships,
               (SELECT GROUP_CONCAT(rj.job_id SEPARATOR '|||') FROM rememberedjobs rj
                 WHERE rj.student_id = s.id) AS saved_job_ids,
               (SELECT jl.active FROM jobletterconfig jl
                 WHERE jl.student_id = s.id LIMIT 1) AS jobletter_active
        FROM students s JOIN people p ON p.id = s.person_id
        """,
    )
    students = [s for s in students if s["memberships"] == 0 or s["stujo"] > 0]
    if drop_junk_students:
        before_s = len(students)
        students = [s for s in students if is_migratable_email(s.get("email"))]
        log.info("drop-junk-students filter: dropped %s students with invalid/disposable email",
                 before_s - len(students))

    return {
        "companies": companies,
        "contacts": contacts,
        "jobs": jobs,
        "counters": counters,
        "students": students,
    }


# ---------------------------------------------------------------------------
# Load steps (each idempotent)
# ---------------------------------------------------------------------------

def step_companies(hasura: HasuraClient, gcs_bucket, files_root, companies) -> dict:
    """Companies → Organization (CORPORATION). Returns rails_id → org_id."""
    existing = hasura.query(
        """query { Organization { id name aliases logo } }"""
    )["Organization"]
    # "" is deliberately not a key: a junk-named organization must not be a dedupe
    # target for every other junk-named company (see normalize_company_name).
    by_norm = {}
    for o in existing:
        norm_existing = normalize_company_name(o["name"])
        if norm_existing:
            by_norm[norm_existing] = o
    by_alias = {}
    for o in existing:
        for alias in o.get("aliases") or []:
            by_alias[alias] = o

    existing_names = {o["name"] for o in existing}

    mapping = {}
    for c in companies:
        legacy_alias = f"stujo:{c['id']}-{slugify(c['name'])}"
        norm = normalize_company_name(c["name"])
        # An empty normalization carries no identity (see normalize_company_name),
        # so it must never dedupe: matching on it merged a junk-named StuJo company
        # into the placeholder Organization "-" and made its contact an admin there.
        # Such a company still migrates, as its own organization.
        if not norm:
            log.warning("company %s '%s' normalizes to nothing — not deduped, "
                        "migrating as its own organization", c["id"], c["name"])
        org = by_alias.get(legacy_alias) or (by_norm.get(norm) if norm else None)
        if org:
            # Duplicate company rows in the Rails DB (23 exist, e.g. two
            # 'terwixonse') merge into one Organization; record this row's
            # legacy alias too so old URLs keep redirecting.
            mapping[c["id"]] = org["id"]
            aliases = org.get("aliases") or []
            if legacy_alias not in aliases:
                # Compute the new array client-side and _set it: some orgs have
                # aliases = null, and Postgres `null || jsonb` is null, so a
                # Hasura _append would silently drop the alias (and .append on
                # None would crash).
                new_aliases = aliases + [legacy_alias]
                hasura.mutate(
                    """
                    mutation ($id: Int!, $aliases: jsonb!) {
                      update_Organization_by_pk(pk_columns: {id: $id}, _set: {aliases: $aliases}) { id }
                    }
                    """,
                    {"id": org["id"], "aliases": new_aliases},
                )
                org["aliases"] = new_aliases
                by_alias[legacy_alias] = org
            # Backfill a logo onto a matched org that has none (repairs a prior
            # run whose upload failed after the insert; fills a null logo on a
            # name-matched pre-existing org). Never overwrites an existing logo.
            if org.get("logo") is None:
                logo_path = copy_paperclip_logo(gcs_bucket, files_root, org["id"], c)
                if logo_path:
                    _set_org_logo(hasura, org["id"], logo_path)
                    org["logo"] = logo_path
                    log.info("company %s: backfilled logo on Organization %s", c["id"], org["id"])
            log.info("company %s → existing Organization %s (%s)", c["id"], org["id"], org["name"])
            continue

        # Organization.name is unique. Without the name dedupe above, a junk name can
        # collide with an existing organization that carries it verbatim, which would
        # abort the whole run — so those get the source row appended to stay distinct
        # (and recognizable as imported junk in the UI).
        org_name = c["name"]
        if not norm and org_name in existing_names:
            org_name = f"{org_name} (StuJo #{c['id']})"

        address_line = " ".join(filter(None, [c.get("street"), c.get("nr")])) or None
        result = hasura.mutate(
            """
            mutation ($obj: Organization_insert_input!) {
              insert_Organization_one(object: $obj) { id }
            }
            """,
            {
                "obj": {
                    "name": org_name,
                    "type": "CORPORATION",
                    "description": c.get("description"),
                    "website": normalize_website(c.get("url")),
                    "addressLine1": address_line,
                    "postalCode": c.get("zip"),
                    "city": c.get("city"),
                    "aliases": [legacy_alias],
                }
            },
        )
        org_id = result["insert_Organization_one"]["id"] if result else -c["id"]
        mapping[c["id"]] = org_id
        # The logo path needs the new org id, so upload + set it after the
        # insert (organizations/org-<id>/public/logo/...); in a dry run the
        # same call is only a pre-flight file check and returns None.
        logo_path = copy_paperclip_logo(gcs_bucket, files_root, org_id, c)
        if logo_path:
            _set_org_logo(hasura, org_id, logo_path)
        # Register the new org in the dedupe maps so later duplicate rows
        # in the same run merge instead of violating Organization_name_key.
        created = {"id": org_id, "name": org_name, "aliases": [legacy_alias], "logo": logo_path}
        # Only a meaningful normalization may serve later rows; registering "" would
        # re-introduce the junk collision within a single run.
        if norm:
            by_norm[norm] = created
        by_alias[legacy_alias] = created
        existing_names.add(org_name)
        log.info("company %s '%s' → new Organization %s", c["id"], org_name, org_id)
    return mapping


def safe_filename(name: str) -> str:
    """URL-clean leaf/object name. Legacy Paperclip filenames carry spaces and
    umlauts; the frontend builds file URLs by plain concatenation without
    percent-encoding (resolveStorageUrl / getPublicUrl), so the stored path
    must already be URL-safe. One file lives per folder here, so slugifying
    the stem can't collide."""
    stem, ext = os.path.splitext(name)
    return f"{slugify(stem) or 'file'}{ext.lower()}"


def copy_paperclip_logo(gcs_bucket, files_root, org_id, company) -> str | None:
    """Copy system/logos/:id/original/:filename to
    organizations/org-<org_id>/public/logo/<file> and return the bucket-
    RELATIVE path — the native EduHub layout for org logos, keyed by the new
    Organization.id. The frontend prefixes NEXT_PUBLIC_STORAGE_BUCKET_URL.

    Dry runs (gcs_bucket None) still verify the file on disk and feed
    FILE_STATS, so a dry run doubles as a pre-flight check of the rsynced
    Rails public/ dir; only the upload is skipped.
    """
    if not company.get("logo_file_name") or not files_root:
        return None
    src = os.path.join(
        files_root, "system", "logos", str(company["id"]), "original",
        company["logo_file_name"],
    )
    if not os.path.exists(src):
        log.warning("logo missing on disk: %s", src)
        FILE_STATS["logos_missing"] += 1
        return None
    FILE_STATS["logos_copied"] += 1
    if gcs_bucket is None:  # dry run
        return None
    blob_name = f"organizations/org-{org_id}/public/logo/{safe_filename(company['logo_file_name'])}"
    # public-read ACL so the object resolves anonymously (bucket UBLA is OFF
    # and has no allUsers binding — visibility is per object), matching how the
    # app serves its own uploads under a /public/ path segment.
    gcs_bucket.blob(blob_name).upload_from_filename(src, predefined_acl="publicRead")
    return blob_name


def copy_paperclip_pdf(gcs_bucket, files_root, job_posting_id, job) -> str | None:
    """Copy the Paperclip job PDF to
    jobpostings/jobposting-<job_posting_id>/public/<file> and return the
    bucket-RELATIVE path — the same layout the dashboard uploader
    (saveJobPostingPdf) writes, keyed by the new JobPosting.id.

    Same dry-run/pre-flight semantics as copy_paperclip_logo.
    """
    if not job.get("pdf_file_name") or not files_root:
        return None
    id_partition = "/".join(re.findall("...", f"{job['id']:09d}"))
    src = os.path.join(
        files_root, "system", "jobs", "pdfs", id_partition, "original",
        job["pdf_file_name"],
    )
    if not os.path.exists(src):
        log.warning("job pdf missing on disk: %s", src)
        FILE_STATS["pdfs_missing"] += 1
        return None
    FILE_STATS["pdfs_copied"] += 1
    if gcs_bucket is None:  # dry run
        return None
    blob_name = f"jobpostings/jobposting-{job_posting_id}/public/{safe_filename(job['pdf_file_name'])}"
    gcs_bucket.blob(blob_name).upload_from_filename(src, predefined_acl="publicRead")
    return blob_name


def _set_org_logo(hasura: "HasuraClient", org_id: int, path: str) -> None:
    hasura.mutate(
        """
        mutation ($id: Int!, $logo: String!) {
          update_Organization_by_pk(pk_columns: {id: $id}, _set: {logo: $logo}) { id }
        }
        """,
        {"id": org_id, "logo": path},
    )


def _set_job_pdf(hasura: "HasuraClient", posting_id: int, path: str) -> None:
    hasura.mutate(
        """
        mutation ($id: Int!, $url: String!) {
          update_JobPosting_by_pk(pk_columns: {id: $id}, _set: {pdfUrl: $url}) { id }
        }
        """,
        {"id": posting_id, "url": path},
    )


def _sync_job_tags(hasura: "HasuraClient", posting_id: int, tags: list) -> None:
    """Replace a posting's tag set on a full-upsert re-run: delete the existing
    rows and re-insert the current ones. Simpler than diffing and tag counts per
    job are tiny. Both mutations are no-ops under --dry-run."""
    hasura.mutate(
        """
        mutation ($id: Int!) {
          delete_JobPostingTag(where: {jobPostingId: {_eq: $id}}) { affected_rows }
        }
        """,
        {"id": posting_id},
    )
    if tags:
        hasura.mutate(
            """
            mutation ($objs: [JobPostingTag_insert_input!]!) {
              insert_JobPostingTag(
                objects: $objs,
                on_conflict: {constraint: JobPostingTag_jobPostingId_name_key, update_columns: []}
              ) { affected_rows }
            }
            """,
            {"objs": [{"jobPostingId": posting_id, "name": t} for t in tags]},
        )


def find_account_by_email(hasura: "HasuraClient", email: str):
    """Look an EduHub account up by address — exactly, and case-insensitively.

    Two traps this closes:
      - ILIKE wildcards. Legacy addresses contain "_" (and occasionally "%"),
        which ILIKE reads as a pattern: an unescaped lookup for
        `max_mustermann@x.de` also matches `max.mustermann@x.de`, and the StuJo
        grant would land on a different person. The address is escaped.
      - GUEST rows are not accounts. User_email_non_guest_key exists precisely so
        one address can carry a guest record *and* the account that later claims
        it, so a guest row must not be mistaken for the account.

    Returns (user_id, rows). user_id is None when nothing matched, and also when
    several accounts share the address — picking one of them would silently give
    the wrong person the grant, so the caller skips instead of guessing.
    """
    rows = hasura.query(
        """
        query ($pattern: String!) {
          User(where: {email: {_ilike: $pattern}, status: {_neq: GUEST}}) { id email }
        }
        """,
        {"pattern": like_escape(email)},
    )["User"]
    return (rows[0]["id"] if len(rows) == 1 else None), rows


def step_users(hasura: HasuraClient, keycloak, contacts, org_mapping) -> dict:
    """Employer accounts → Keycloak (bcrypt import) + User + OrganizationAdmin.

    The Keycloak instance has the bcrypt password-hash extension, so the
    Rails bcrypt hashes are imported as credentials and passwords keep
    working. Users are matched by email first (many employers already have
    EduHub accounts). Every account also gets the hasura client roles it
    needs (see grant_client_role calls below): x-hasura-allowed-roles is
    built from the user's hasura client-role mappings, so without them the
    JWT is useless. Returns rails contact_id → EduHub User.id, used by
    step_jobs to fill JobPosting.contactUserId.
    """
    user_mapping = {}
    skipped = 0
    for c in contacts:
        email = (c.get("email") or "").strip().lower()
        if not email or c["company_id"] not in org_mapping:
            continue
        org_id = org_mapping[c["company_id"]]

        user_id, matches = find_account_by_email(hasura, email)
        if user_id is None and matches:
            log.warning("skipping contact %s (%s): %s accounts share this address — "
                        "resolve the duplicate, then re-run (idempotent)",
                        c["id"], mask_email(email), len(matches))
            skipped += 1
            continue

        if user_id is None:
            if keycloak is None:
                if not hasura.dry_run:
                    raise RuntimeError(
                        f"Keycloak client not configured — refusing to silently "
                        f"skip user creation for contact {c['id']} "
                        f"({mask_email(email)}) in a real run"
                    )
                log.info("[dry-run] would create Keycloak user %s (bcrypt import)",
                         mask_email(email))
                continue
            # Some legacy contacts have unusable emails (a URL typed into the
            # field, a non-ASCII local part, …) that Keycloak rejects. One such
            # employer must not abort the whole step: log and skip so the rest
            # migrate. Their org still exists; the contact can re-register or be
            # fixed later. A re-run is idempotent.
            try:
                user_id = keycloak.create_user_with_bcrypt(
                    email=email,
                    first_name=c.get("forname") or "",
                    last_name=c.get("name") or "",
                    bcrypt_hash=c.get("password_hash"),
                )
            except RuntimeError as exc:
                log.warning("skipping contact %s (%s): %s",
                            c["id"], mask_email(email), exc)
                skipped += 1
                continue
            # Mirror into the User table right away (the updateFromKeycloak
            # event only fires on interactive logins) so the FK targets for
            # OrganizationAdmin / JobPosting.contactUserId exist.
            hasura.mutate(
                """
                mutation ($obj: User_insert_input!) {
                  insert_User_one(object: $obj, on_conflict: {constraint: User_pkey, update_columns: []}) { id }
                }
                """,
                {"obj": {"id": user_id, "email": email,
                         "firstName": c.get("forname") or "",
                         "lastName": c.get("name") or ""}},
            )
        user_mapping[c["id"]] = user_id

        # Hasura JWT roles: `user` is the base role every EduHub account
        # needs (x-hasura-default-role is hardcoded to "user" and must be in
        # x-hasura-allowed-roles, which mirrors the hasura client roles —
        # the createUser action grants it the same way); `org_admin` is what
        # the Mein-StuJo dashboard elevates to. Granting is idempotent, so
        # both are ensured even for employers who already had an account
        # (and on re-runs after a partial first run).
        if keycloak is not None:
            keycloak.grant_client_role(user_id, "user")
            keycloak.grant_client_role(user_id, "org_admin")
        elif not hasura.dry_run:
            raise RuntimeError(
                f"Keycloak client not configured — cannot grant user/org_admin "
                f"to contact {c['id']} ({mask_email(email)})"
            )

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
        log.info("contact %s (%s) → OrganizationAdmin of org %s",
                 c["id"], mask_email(email), org_id)
    if skipped:
        log.info("users: skipped %s contact(s) with an unimportable email", skipped)
    return user_mapping


def step_jobs(hasura: HasuraClient, gcs_bucket, files_root, jobs, org_mapping,
              user_mapping, haw_org_id):
    """jobs → JobPosting (+ tags). Matched via legacyStujoId. New postings are
    inserted; already-migrated ones are fully upserted on a delta re-run —
    content, status, expiry and tags are overwritten from StuJo (source of
    truth until cutover), and a missing pdfUrl / contactUserId is backfilled."""
    existing = {
        row["legacyStujoId"]: row
        for row in hasura.query(
            "query { JobPosting(where: {legacyStujoId: {_is_null: false}}) { id legacyStujoId pdfUrl contactUserId } }"
        )["JobPosting"]
    }

    for j in jobs:
        if j["company_id"] not in org_mapping:
            continue
        posting_type = CATEGORY_TO_TYPE.get(j["category_id"])
        if posting_type is None:
            log.warning("job %s: unknown category %s — skipped", j["id"], j["category_id"])
            continue

        published = j["status"] in (STATUS_ACTIVE, STATUS_FEATURED)
        created = j["created_at"]
        if created and created.tzinfo is None:  # MySQL returns naive datetimes
            created = created.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if published:
            # Business decision (2026-07-11): the Rails archiver was dead, so
            # every currently visible ("active") job gets a fresh 8-week window
            # at cutover; the expire cron then shrinks the catalog organically.
            # On a full-upsert delta re-run this re-arms the window, so the final
            # pre-cutover run defines the live catalog's expiry.
            status = "PUBLISHED"
            expires = now + timedelta(days=PUBLICATION_DAYS)
        else:
            # The Rails ARCHIVE is the pool employers re-post from, so it maps
            # to EXPIRED — the only non-published status publishJobPosting
            # accepts and the dashboard offers "Erneut inserieren" for
            # (ARCHIVED would be a dead end). expiresAt must lie in the past.
            status = "EXPIRED"
            expires = created + timedelta(days=PUBLICATION_DAYS) if created else None
            if expires is None or expires >= now:
                expires = now - timedelta(days=1)

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
        # Duplicate tags on the same job exist in the prod data; dedupe
        # (unique constraint JobPostingTag_jobPostingId_name_key).
        tags = list(dict.fromkeys(t for t in (j.get("tag_names") or "").split("|||") if t))

        contact_user_id = user_mapping.get(j["contact_id"])
        # Mutable target columns, shared by the insert and the full-upsert
        # update path (everything except the legacyStujoId match key and the
        # nested tags, which are reconciled separately).
        fields = {
            "organizationId": org_mapping[j["company_id"]],
            "slug": f"{j['id']}-{slugify(j['title'])}",
            "type": posting_type,
            "status": status,
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
            "views": j.get("views") or 0,
            "restrictedToOrganizationId": restricted_to,
            # Legacy archived jobs were once live, so publishedAt is their
            # creation date and expiresAt lies in the past.
            "publishedAt": created.isoformat() if created else None,
            "expiresAt": expires.isoformat() if expires else None,
        }

        prior = existing.get(j["id"])
        if prior:
            # Full upsert (business decision: StuJo is source of truth until
            # cutover, so a delta re-run overwrites content, status, expiry and
            # tags of already-migrated postings). contactUserId is only written
            # when we can resolve it, so a contact that briefly failed to import
            # does not null out an already-linked posting.
            set_fields = dict(fields)
            if contact_user_id:
                set_fields["contactUserId"] = contact_user_id
            hasura.mutate(
                """
                mutation ($id: Int!, $set: JobPosting_set_input!) {
                  update_JobPosting_by_pk(pk_columns: {id: $id}, _set: $set) { id }
                }
                """,
                {"id": prior["id"], "set": set_fields},
            )
            _sync_job_tags(hasura, prior["id"], tags)
            # PDF: (re)upload when the posting has none yet and a file exists —
            # repairs an incomplete first rsync; keyed by the existing id.
            if prior["pdfUrl"] is None and j.get("pdf_file_name"):
                pdf_path = copy_paperclip_pdf(gcs_bucket, files_root, prior["id"], j)
                if pdf_path:
                    _set_job_pdf(hasura, prior["id"], pdf_path)
            log.info("job %s '%s' → updated JobPosting %s (%s)",
                     j["id"], j["title"], prior["id"], status)
            continue

        result = hasura.mutate(
            """
            mutation ($obj: JobPosting_insert_input!) {
              insert_JobPosting_one(object: $obj) { id }
            }
            """,
            {
                "obj": {
                    "legacyStujoId": j["id"],
                    "contactUserId": contact_user_id,
                    **fields,
                    "JobPostingTags": {"data": [{"name": t} for t in tags]},
                }
            },
        )
        posting_id = result["insert_JobPosting_one"]["id"] if result else None
        # The PDF path needs the new posting id, so upload + set it after the
        # insert (jobpostings/jobposting-<id>/public/...), matching the
        # dashboard uploader; a dry run only pre-flights the file (returns None).
        pdf_path = copy_paperclip_pdf(gcs_bucket, files_root, posting_id, j)
        if posting_id is not None and pdf_path:
            _set_job_pdf(hasura, posting_id, pdf_path)
        log.info("job %s '%s' → JobPosting (%s)", j["id"], j["title"], status)


def step_students(hasura: HasuraClient, keycloak, students):
    """Students → Keycloak/User (dedupe by email) + SavedJobPosting +
    JobAlertSubscription (business decision 2026-07-11: migrate all 322).
    """
    # Legacy job id → new JobPosting id, for the saved-jobs import.
    posting_map = {
        row["legacyStujoId"]: row["id"]
        for row in hasura.query(
            "query { JobPosting(where: {legacyStujoId: {_is_null: false}}) { id legacyStujoId } }"
        )["JobPosting"]
    }

    skipped = 0
    for s in students:
        email = (s.get("email") or "").strip().lower()
        if not email:
            continue

        user_id, matches = find_account_by_email(hasura, email)
        if user_id is None and matches:
            log.warning("skipping student %s (%s): %s accounts share this address — "
                        "resolve the duplicate, then re-run (idempotent)",
                        s["student_id"], mask_email(email), len(matches))
            skipped += 1
            continue

        if user_id is not None:
            log.info("student %s (%s) → existing User %s",
                     s["student_id"], mask_email(email), user_id)
        else:
            if keycloak is None:
                if not hasura.dry_run:
                    raise RuntimeError(
                        f"Keycloak client not configured — refusing to silently "
                        f"skip user creation for student {s['student_id']} "
                        f"({mask_email(email)}) in a real run"
                    )
                log.info("[dry-run] would create Keycloak user %s (bcrypt import)",
                         mask_email(email))
                continue
            # A single unimportable student (e.g. Keycloak rejects a non-ASCII
            # email local part) must not abort the whole step — students are the
            # lowest-value records (plan §3) and such an address is unusable for
            # login anyway. Log and skip so the rest still migrate; a re-run is
            # idempotent and will retry nothing that already landed.
            try:
                user_id = keycloak.create_user_with_bcrypt(
                    email=email,
                    first_name=s.get("forname") or "",
                    last_name=s.get("name") or "",
                    bcrypt_hash=s.get("password_hash"),
                )
            except RuntimeError as exc:
                log.warning("skipping student %s (%s): %s",
                            s["student_id"], mask_email(email), exc)
                skipped += 1
                continue
            # Mirror into the User table right away so the SavedJobPosting /
            # JobAlertSubscription FKs below resolve.
            hasura.mutate(
                """
                mutation ($obj: User_insert_input!) {
                  insert_User_one(object: $obj, on_conflict: {constraint: User_pkey, update_columns: []}) { id }
                }
                """,
                {"obj": {"id": user_id, "email": email,
                         "firstName": s.get("forname") or "",
                         "lastName": s.get("name") or ""}},
            )

        # Base hasura role, same as for employers: without `user` in
        # x-hasura-allowed-roles the account cannot query anything. Granted
        # on both paths (idempotent no-op for accounts that already have it)
        # so a re-run repairs users from a partial first run.
        if keycloak is not None:
            keycloak.grant_client_role(user_id, "user")

        # Saved jobs (rememberedjobs) → SavedJobPosting
        for legacy_id in (s.get("saved_job_ids") or "").split("|||"):
            if not legacy_id:
                continue
            posting_id = posting_map.get(int(legacy_id))
            if not posting_id:
                continue
            hasura.mutate(
                """
                mutation ($obj: SavedJobPosting_insert_input!) {
                  insert_SavedJobPosting_one(
                    object: $obj,
                    on_conflict: {constraint: SavedJobPosting_userId_jobPostingId_key, update_columns: []}
                  ) { id }
                }
                """,
                {"obj": {"userId": user_id, "jobPostingId": posting_id}},
            )

        # Old job-letter config → JobAlertSubscription (weekly cron)
        if s.get("jobletter_active"):
            hasura.mutate(
                """
                mutation ($obj: JobAlertSubscription_insert_input!) {
                  insert_JobAlertSubscription_one(
                    object: $obj,
                    on_conflict: {constraint: JobAlertSubscription_userId_key, update_columns: [active]}
                  ) { id }
                }
                """,
                {"obj": {"userId": user_id, "active": True}},
            )

    if skipped:
        log.info("students: skipped %s unimportable account(s)", skipped)


def step_credits(hasura: HasuraClient, counters, org_mapping):
    """Remaining paymentcounters credits → JobPostingCredit (untyped).

    on_conflict cannot make this idempotent: the unique constraint on
    (organizationId, jobPostingType) never fires for jobPostingType NULL
    because Postgres treats NULLs as distinct. Existing untyped rows are
    therefore queried up front; a delta re-run reconciles their `remaining`
    to the current StuJo balance (source of truth until cutover) rather than
    skipping, so credits consumed/bought between runs stay in sync.
    """
    existing = {
        row["organizationId"]: row
        for row in hasura.query(
            "query { JobPostingCredit(where: {jobPostingType: {_is_null: true}}) { id organizationId remaining } }"
        )["JobPostingCredit"]
    }

    # Aggregate per organization first: duplicate Rails company rows merge
    # into one Organization, so several paymentcounters can target one org.
    per_org = {}
    for pc in counters:
        org_id = org_mapping.get(pc["company_id"])
        if org_id is None:
            continue
        # Rails uses `job` as the generic free-posting counter in the current
        # flow (free == "promo" decrements it); -1 means unlimited legacy tier.
        remaining = pc.get("job") or 0
        if remaining == -1:
            log.warning(
                "paymentcounter %s (company %s → org %s): legacy UNLIMITED "
                "tier — imported as %s credits (sentinel, review manually)",
                pc["id"], pc["company_id"], org_id, UNLIMITED_CREDITS_SENTINEL,
            )
            remaining = UNLIMITED_CREDITS_SENTINEL
        if remaining <= 0:
            continue
        per_org[org_id] = min(per_org.get(org_id, 0) + remaining, UNLIMITED_CREDITS_SENTINEL)

    for org_id, remaining in sorted(per_org.items()):
        if org_id in existing:
            prior = existing[org_id]
            if prior["remaining"] != remaining:
                hasura.mutate(
                    """
                    mutation ($id: Int!, $remaining: Int!) {
                      update_JobPostingCredit_by_pk(pk_columns: {id: $id}, _set: {remaining: $remaining}) { id }
                    }
                    """,
                    {"id": prior["id"], "remaining": remaining},
                )
                log.info("org %s: reconciled untyped credit %s remaining %s → %s",
                         org_id, prior["id"], prior["remaining"], remaining)
            else:
                log.info("org %s already has %s untyped credit(s) — unchanged",
                         org_id, remaining)
            continue
        hasura.mutate(
            """
            mutation ($obj: JobPostingCredit_insert_input!) {
              insert_JobPostingCredit_one(object: $obj) { id }
            }
            """,
            {"obj": {"organizationId": org_id, "jobPostingType": None, "remaining": remaining}},
        )
        log.info("→ %s credit(s) for org %s", remaining, org_id)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="no writes, log intent only")
    parser.add_argument("--steps", default="companies,users,jobs,credits,students")
    parser.add_argument("--haw-org-id", type=int, default=None,
                        help="Organization.id of HAW Kiel (mandate restriction target)")
    parser.add_argument("--retention-years", type=int,
                        default=int(os.environ.get("RETENTION_YEARS", "0")) or None,
                        help="opt-in restriction for test runs; default: migrate everything")
    parser.add_argument("--include-jobless-companies", action="store_true",
                        help="also migrate companies with no active job posting "
                             "(default: skip them — they are inactive/spam shells)")
    parser.add_argument("--keep-junk-students", action="store_true",
                        help="also migrate students with an invalid/disposable "
                             "email (default: skip them)")
    args = parser.parse_args()
    steps = set(args.steps.split(","))

    dsn = os.environ.get("STUJO_MYSQL_DSN")
    hasura_url = os.environ.get("HASURA_URL")
    admin_secret = os.environ.get("HASURA_ADMIN_SECRET")
    files_root = os.environ.get("STUJO_FILES_ROOT", "")
    if not dsn or not hasura_url or not admin_secret:
        log.error("STUJO_MYSQL_DSN, HASURA_URL and HASURA_ADMIN_SECRET are required")
        sys.exit(2)

    # Logos/PDFs move during the companies/jobs steps; running those for real
    # without the bucket or the rsynced Rails public/ dir would silently
    # migrate every record with null logo/pdfUrl (and re-runs skip existing
    # rows, so the loss would be permanent for organizations).
    if not args.dry_run and ({"companies", "jobs"} & steps):
        if not os.environ.get("GCS_BUCKET") or not files_root:
            log.error("GCS_BUCKET and STUJO_FILES_ROOT are required for the "
                      "companies/jobs steps in a real run (rsync the Rails "
                      "public/ dir first; see plan §7)")
            sys.exit(2)

    gcs_bucket = None
    if os.environ.get("GCS_BUCKET") and not args.dry_run:
        from google.cloud import storage

        gcs_bucket = storage.Client().bucket(os.environ["GCS_BUCKET"])

    keycloak = None  # stays None in dry runs (steps only log what they would do)
    if not args.dry_run and ({"users", "students"} & steps):
        kc_url = os.environ.get("KEYCLOAK_URL")
        kc_user = os.environ.get("KEYCLOAK_USER")
        kc_pw = os.environ.get("KEYCLOAK_PW")
        kc_realm = os.environ.get("KEYCLOAK_REALM", "edu-hub")
        if not kc_url or not kc_user or not kc_pw:
            log.error("KEYCLOAK_URL, KEYCLOAK_USER and KEYCLOAK_PW are required "
                      "for the users/students steps in a real run")
            sys.exit(2)
        keycloak = KeycloakClient(kc_url, kc_realm, kc_user, kc_pw)

    hasura = HasuraClient(hasura_url, admin_secret, args.dry_run)
    cnx = mysql_connection(dsn)
    src = load_source(cnx, args.retention_years,
                      only_with_jobs=not args.include_jobless_companies,
                      drop_junk_students=not args.keep_junk_students)
    log.info(
        "loaded: %s companies, %s contacts, %s jobs, %s counters, %s students",
        len(src["companies"]), len(src["contacts"]), len(src["jobs"]),
        len(src["counters"]), len(src["students"]),
    )

    org_mapping = {}
    user_mapping = {}
    if "companies" in steps:
        org_mapping = step_companies(hasura, gcs_bucket, files_root, src["companies"])
    if "users" in steps:
        user_mapping = step_users(hasura, keycloak, src["contacts"], org_mapping)
    if "jobs" in steps:
        step_jobs(hasura, gcs_bucket, files_root, src["jobs"], org_mapping,
                  user_mapping, args.haw_org_id)
    if "credits" in steps:
        step_credits(hasura, src["counters"], org_mapping)
    if "students" in steps:
        step_students(hasura, keycloak, src["students"])

    if any(FILE_STATS.values()):
        log.info(
            "file copy summary: %s logos copied, %s logos missing, "
            "%s job PDFs copied, %s job PDFs missing",
            FILE_STATS["logos_copied"], FILE_STATS["logos_missing"],
            FILE_STATS["pdfs_copied"], FILE_STATS["pdfs_missing"],
        )
        if (FILE_STATS["logos_missing"] or FILE_STATS["pdfs_missing"]) and not args.dry_run:
            log.warning("some files were missing on disk — complete the rsync "
                        "and re-run; missing pdfUrls are backfilled on re-runs")
    log.info("done%s", " (dry run)" if args.dry_run else "")


if __name__ == "__main__":
    main()
