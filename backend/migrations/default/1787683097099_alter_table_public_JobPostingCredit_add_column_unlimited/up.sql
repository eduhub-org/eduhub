-- "Free postings in general": an unlimited grant publishes without charging and
-- without decrementing, so "remaining" is ignored while it is set.
ALTER TABLE "public"."JobPostingCredit"
  ADD COLUMN "unlimited" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."JobPostingCredit"."unlimited" IS 'Unlimited free postings for this organization/type; "remaining" is ignored while true';

-- Postgres treats NULLs as distinct, so UNIQUE ("organizationId", "jobPostingType")
-- never fires for the untyped ("any paid type") rows that both the admin UI and
-- the StuJo ETL create. Merge any pre-existing duplicates into the lowest id,
-- then enforce one untyped row per organization so a grant can never be split
-- across rows (which would be worse once "unlimited" is in play).
UPDATE "public"."JobPostingCredit" c
SET "remaining" = agg."total"
FROM (
  SELECT MIN("id") AS keep_id, SUM("remaining") AS total
  FROM "public"."JobPostingCredit"
  WHERE "jobPostingType" IS NULL
  GROUP BY "organizationId"
  HAVING COUNT(*) > 1
) agg
WHERE c."id" = agg.keep_id;

DELETE FROM "public"."JobPostingCredit" c
USING (
  SELECT "organizationId", MIN("id") AS keep_id
  FROM "public"."JobPostingCredit"
  WHERE "jobPostingType" IS NULL
  GROUP BY "organizationId"
) agg
WHERE c."jobPostingType" IS NULL
  AND c."organizationId" = agg."organizationId"
  AND c."id" <> agg.keep_id;

CREATE UNIQUE INDEX "JobPostingCredit_organizationId_untyped_unique"
  ON "public"."JobPostingCredit" ("organizationId")
  WHERE "jobPostingType" IS NULL;
