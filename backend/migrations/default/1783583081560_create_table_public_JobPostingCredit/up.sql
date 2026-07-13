-- Free-posting credits per employer organization. Seeded by the ETL from the
-- remaining Rails paymentcounters and grantable by admins (promo codes).
-- Checkout consumes a credit instead of charging when one is available.
CREATE TABLE "public"."JobPostingCredit" (
  "id"             serial      NOT NULL,
  "organizationId" integer     NOT NULL,
  "jobPostingType" text        NULL,
  "remaining"      integer     NOT NULL DEFAULT 0,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("organizationId", "jobPostingType")
);

COMMENT ON TABLE "public"."JobPostingCredit" IS E'Free job-posting credits per employer organization.';
COMMENT ON COLUMN "public"."JobPostingCredit"."jobPostingType" IS 'Type the credit applies to; null = any paid type';

ALTER TABLE "public"."JobPostingCredit"
  ADD CONSTRAINT "JobPostingCredit_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE "public"."JobPostingCredit"
  ADD CONSTRAINT "JobPostingCredit_jobPostingType_fkey"
  FOREIGN KEY ("jobPostingType") REFERENCES "public"."JobPostingType"("value")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "JobPostingCredit_organizationId_idx" ON "public"."JobPostingCredit" ("organizationId");

CREATE TRIGGER "set_public_JobPostingCredit_updated_at"
BEFORE UPDATE ON "public"."JobPostingCredit"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
