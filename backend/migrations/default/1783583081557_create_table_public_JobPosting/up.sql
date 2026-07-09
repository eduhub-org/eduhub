-- Job postings, ported from the StuJo Rails "jobs" table.
-- Field mapping documented in docs/STUJO_INTEGRATION_PLAN.md section 5.
CREATE TABLE "public"."JobPosting" (
  "id"                          serial      NOT NULL,
  "slug"                        text        NULL,
  "organizationId"              integer     NOT NULL,
  "contactUserId"               uuid        NULL,
  "type"                        text        NOT NULL,
  "status"                      text        NOT NULL DEFAULT 'DRAFT',
  "region"                      text        NULL,
  "occupation"                  text        NOT NULL DEFAULT 'OTHER',
  "title"                       text        NOT NULL,
  "description"                 text        NULL,
  "shortDescription"            text        NULL,
  "requirement"                 text        NULL,
  "location"                    text        NULL,
  "salaryText"                  text        NULL,
  "startText"                   text        NULL,
  "durationText"                text        NULL,
  "applicationDeadline"         date        NULL,
  "workExperienceRequired"      boolean     NOT NULL DEFAULT false,
  "hoursPerWeek"                integer     NULL,
  "language"                    text        NULL,
  "international"               boolean     NOT NULL DEFAULT false,
  "internationalDescription"    text        NULL,
  "customCompany"               text        NULL,
  "featured"                    boolean     NOT NULL DEFAULT false,
  "pdfUrl"                      text        NULL,
  "views"                       integer     NOT NULL DEFAULT 0,
  "restrictedToOrganizationId"  integer     NULL,
  "publishedAt"                 timestamptz NULL,
  "expiresAt"                   timestamptz NULL,
  "legacyStujoId"               integer     NULL,
  "created_at"                  timestamptz NOT NULL DEFAULT now(),
  "updated_at"                  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("legacyStujoId")
);

COMMENT ON TABLE "public"."JobPosting" IS E'Job posting on the StuJo job board (shared across all portals).';
COMMENT ON COLUMN "public"."JobPosting"."customCompany" IS 'Free-text company name when posting on behalf of a third company (StuJo custom_Company)';
COMMENT ON COLUMN "public"."JobPosting"."restrictedToOrganizationId" IS 'When set, only visible to users whose User.organizationId matches (replaces StuJo mandate restrictions)';
COMMENT ON COLUMN "public"."JobPosting"."legacyStujoId" IS 'Rails jobs.id, for ETL idempotency and 301 redirects';

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_contactUserId_fkey"
  FOREIGN KEY ("contactUserId") REFERENCES "public"."User"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_type_fkey"
  FOREIGN KEY ("type") REFERENCES "public"."JobPostingType"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_status_fkey"
  FOREIGN KEY ("status") REFERENCES "public"."JobPostingStatus"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_region_fkey"
  FOREIGN KEY ("region") REFERENCES "public"."JobRegion"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_occupation_fkey"
  FOREIGN KEY ("occupation") REFERENCES "public"."JobOccupation"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."JobPosting"
  ADD CONSTRAINT "JobPosting_restrictedToOrganizationId_fkey"
  FOREIGN KEY ("restrictedToOrganizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE INDEX "JobPosting_organizationId_idx" ON "public"."JobPosting" ("organizationId");
CREATE INDEX "JobPosting_status_expiresAt_idx" ON "public"."JobPosting" ("status", "expiresAt");
CREATE INDEX "JobPosting_type_idx" ON "public"."JobPosting" ("type");
CREATE INDEX "JobPosting_slug_idx" ON "public"."JobPosting" ("slug");

CREATE TRIGGER "set_public_JobPosting_updated_at"
BEFORE UPDATE ON "public"."JobPosting"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
