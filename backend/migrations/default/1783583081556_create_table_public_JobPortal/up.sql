-- University portal dimension for the StuJo job board. Portals are a
-- BRANDING dimension only: all portals share one job pool (validated
-- against the Rails source; see docs/STUJO_INTEGRATION_PLAN.md section 2.4).
CREATE TABLE "public"."JobPortal" (
  "id"             serial      NOT NULL,
  "slug"           text        NOT NULL,
  "organizationId" integer     NULL,
  "appName"        text        NOT NULL,
  "title"          text        NOT NULL,
  "contactEmail"   text        NULL,
  "defaultRegion"  text        NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("slug")
);

COMMENT ON TABLE "public"."JobPortal" IS E'StuJo university portal (branding/landing dimension; jobs are shared across portals).';
COMMENT ON COLUMN "public"."JobPortal"."organizationId" IS 'The university organization (type UNIVERSITY); linked after ETL/setup';
COMMENT ON COLUMN "public"."JobPortal"."defaultRegion" IS 'Region filter preset on this portal''s landing page (Flensburg portal presets FLENSBURG)';

ALTER TABLE "public"."JobPortal"
  ADD CONSTRAINT "JobPortal_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE "public"."JobPortal"
  ADD CONSTRAINT "JobPortal_appName_fkey"
  FOREIGN KEY ("appName") REFERENCES "public"."AppSettings"("appName")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."JobPortal"
  ADD CONSTRAINT "JobPortal_defaultRegion_fkey"
  FOREIGN KEY ("defaultRegion") REFERENCES "public"."JobRegion"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX "JobPortal_organizationId_idx" ON "public"."JobPortal" ("organizationId");

CREATE TRIGGER "set_public_JobPortal_updated_at"
BEFORE UPDATE ON "public"."JobPortal"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

INSERT INTO "public"."JobPortal" ("slug", "appName", "title", "defaultRegion") VALUES
  ('stujo', 'stujo', 'StuJo', NULL),
  ('cau', 'stujo-cau', 'StuJo - CAU Kiel', NULL),
  ('haw-kiel', 'stujo-haw-kiel', 'StuJo - HAW Kiel', NULL),
  ('flensburg', 'stujo-flensburg', 'StuJo - Campus Flensburg', 'FLENSBURG');
