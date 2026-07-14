-- Hostname → portal mapping for the StuJo white-label job board. A single
-- portal (AppSettings row) can be reached under MANY hostnames at once:
-- legacy stujo.net subdomains plus the interim opencampus.sh aliases. This
-- supersedes the single-valued "AppSettings"."domain" column as the primary
-- portal-resolution source; that column stays for now as a legacy fallback.
CREATE TABLE "public"."JobPortalDomain" (
  "id"         serial      NOT NULL,
  "appName"    text        NOT NULL,
  "hostname"   text        NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("hostname")
);

COMMENT ON TABLE "public"."JobPortalDomain" IS E'Maps request hostnames to StuJo portals (many hostnames per portal); supersedes the single "AppSettings"."domain" column, which remains as a legacy fallback.';
COMMENT ON COLUMN "public"."JobPortalDomain"."hostname" IS 'Lowercase request host (no port) that resolves to this portal';

ALTER TABLE "public"."JobPortalDomain"
  ADD CONSTRAINT "JobPortalDomain_appName_fkey"
  FOREIGN KEY ("appName") REFERENCES "public"."AppSettings"("appName")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "JobPortalDomain_appName_idx" ON "public"."JobPortalDomain" ("appName");

CREATE TRIGGER "set_public_JobPortalDomain_updated_at"
BEFORE UPDATE ON "public"."JobPortalDomain"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Seed hostname mappings. Staging rows are inert in production and the
-- production opencampus.sh rows are inert on staging; both are seeded here
-- because migrations run in every environment.
INSERT INTO "public"."JobPortalDomain" ("hostname", "appName") VALUES
  -- Legacy stujo.net hosts
  ('stujo.net', 'stujo'),
  ('www.stujo.net', 'stujo'),
  ('cau.stujo.net', 'stujo-cau'),
  ('haw-kiel.stujo.net', 'stujo-haw-kiel'),
  ('fh-kiel.stujo.net', 'stujo-haw-kiel'),
  ('flensburg.stujo.net', 'stujo-flensburg'),
  -- Interim opencampus.sh aliases (production)
  ('stujo.opencampus.sh', 'stujo'),
  ('stujo-cau.opencampus.sh', 'stujo-cau'),
  ('stujo-haw-kiel.opencampus.sh', 'stujo-haw-kiel'),
  ('stujo-flensburg.opencampus.sh', 'stujo-flensburg'),
  -- Interim opencampus.sh aliases (staging)
  ('stujo-staging.opencampus.sh', 'stujo'),
  ('stujo-cau-staging.opencampus.sh', 'stujo-cau'),
  ('stujo-haw-kiel-staging.opencampus.sh', 'stujo-haw-kiel'),
  ('stujo-flensburg-staging.opencampus.sh', 'stujo-flensburg');
