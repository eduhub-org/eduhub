-- Reverse 1788435175704: drop the invariant, then restore every corrected row
-- from the pre-migration snapshot.
--
-- Triggers stay disabled while restoring so that putting a row back into
-- COMPLETED / INCOMPLETE does not mail PROJECT_APPROVED / PROJECT_REJECTED to
-- its authors through send_project_status_email, and so the restored
-- submittedAt/submittedBy survive set_project_submitted_metadata.

ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_completed_requires_passed_rating_check";

ALTER TABLE "public"."Project" DISABLE TRIGGER USER;

UPDATE "public"."Project" p
   SET "status"        = b."status",
       "rating"        = b."rating",
       "ratingComment" = b."ratingComment",
       "submittedAt"   = b."submittedAt",
       "submittedBy"   = b."submittedBy"
  FROM "public"."ProjectLegacyStatusBackup" b
 WHERE b."projectId" = p."id";

ALTER TABLE "public"."Project" ENABLE TRIGGER USER;

DROP TABLE IF EXISTS "public"."ProjectLegacyStatusBackup";
