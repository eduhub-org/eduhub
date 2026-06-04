-- Reverse the achievement -> project migration AND the certificate-template
-- restructure. Best-effort: source HTML is restored from CertificateTemplate
-- back into CertificateTemplateText but per-program / per-course mappings that
-- now live on Program.attendanceCertificateTemplateId,
-- Course.achievementCertificateTemplateId, Course.attendanceCertificateTemplateId
-- and ProjectType.certificateTemplateId are mapped back to
-- CertificateTemplateProgram rows.
--
-- ProjectAuthor.projectId and ProjectCourse.projectId are ON DELETE CASCADE and
-- Project.parentProjectId is ON DELETE SET NULL, so deleting the migrated Project
-- rows removes their authors and course links automatically. Submission projects
-- (legacyAchievementRecordId) are deleted before template projects
-- (legacyAchievementOptionId) so the parent reference is cleared first.

-- 1. Recreate the retired tables.
CREATE TABLE IF NOT EXISTS "public"."CertificateType" (
  "value" text NOT NULL,
  "comment" text,
  PRIMARY KEY ("value")
);
INSERT INTO "public"."CertificateType" ("value", "comment") VALUES
  ('ACHIEVEMENT', 'Achievement certificate.'),
  ('ATTENDANCE',  'Attendance certificate.')
ON CONFLICT ("value") DO NOTHING;

CREATE TABLE IF NOT EXISTS "public"."ProjectAchievementCertificateType" (
  "value" text NOT NULL,
  "comment" text,
  PRIMARY KEY ("value")
);
INSERT INTO "public"."ProjectAchievementCertificateType" ("value", "comment") VALUES
  ('DOCUMENTATION', 'Documentation-style achievement certificate.'),
  ('ONLINE_COURSE', 'Online-course completion certificate layout.')
ON CONFLICT ("value") DO NOTHING;

CREATE TABLE IF NOT EXISTS "public"."CertificateTemplateText" (
  "id"          serial      NOT NULL,
  "title"       text        NOT NULL UNIQUE,
  "html"        text        NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  "certificateType" text,
  "recordType"      text,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("certificateType") REFERENCES "public"."CertificateType"("value") ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY ("recordType")      REFERENCES "public"."AchievementRecordType"("value") ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "public"."CertificateTemplateProgram" (
  "id"                      serial NOT NULL,
  "programId"               integer NOT NULL,
  "certificateTemplateText" integer NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("programId")               REFERENCES "public"."Program"("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY ("certificateTemplateText") REFERENCES "public"."CertificateTemplateText"("id") ON UPDATE RESTRICT ON DELETE RESTRICT
);

-- Re-add the dead Program FK columns (kept for shape parity with the pre-migration schema).
ALTER TABLE "public"."Program"
  ADD COLUMN IF NOT EXISTS "achievementCertificateTemplateTextId" integer,
  ADD COLUMN IF NOT EXISTS "attendanceCertificateTemplateTextId"  integer;

-- 2. Restore CertificateTemplateText rows from CertificateTemplate. Without the
--    original certificateType/recordType labels we tag each restored row with
--    certificateType = 'ACHIEVEMENT' / recordType = 'DOCUMENTATION' as a safe
--    default; production keeps a backup of the original rows outside this
--    migration anyway.
INSERT INTO "public"."CertificateTemplateText" ("id", "title", "html", "created_at", "updated_at", "certificateType", "recordType")
SELECT ct."id", ct."name", ct."html", ct."created_at", ct."updated_at", 'ACHIEVEMENT', 'DOCUMENTATION'
  FROM (
    SELECT DISTINCT ON (ct."name") ct."id", ct."name", ct."html", ct."created_at", ct."updated_at"
      FROM "public"."CertificateTemplate" ct
     ORDER BY ct."name", ct."id" DESC
  ) ct
ON CONFLICT ("id") DO NOTHING;
SELECT setval(pg_get_serial_sequence('public."CertificateTemplateText"','id'), COALESCE((SELECT max(id) FROM "public"."CertificateTemplateText"), 1));

-- 3. Rebuild CertificateTemplateProgram from the new owner FKs.
INSERT INTO "public"."CertificateTemplateProgram" ("programId", "certificateTemplateText")
SELECT p.id, p."attendanceCertificateTemplateId"
  FROM "public"."Program" p
 WHERE p."attendanceCertificateTemplateId" IS NOT NULL;

INSERT INTO "public"."CertificateTemplateProgram" ("programId", "certificateTemplateText")
SELECT DISTINCT c."programId", c."achievementCertificateTemplateId"
  FROM "public"."Course" c
 WHERE c."achievementCertificateTemplateId" IS NOT NULL;

-- 4. Re-add Project.achievementCertificateType column (no data restored).
ALTER TABLE "public"."Project"
  ADD COLUMN IF NOT EXISTS "achievementCertificateType" text;
ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_achievementCertificateType_fkey"
  FOREIGN KEY ("achievementCertificateType")
  REFERENCES "public"."ProjectAchievementCertificateType"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

-- 5. Delete the migrated Project rows.
DELETE FROM "public"."Project" WHERE "legacyAchievementRecordId" IS NOT NULL;
DELETE FROM "public"."Project" WHERE "legacyAchievementOptionId" IS NOT NULL;
DELETE FROM "public"."ProjectDocumentationInstruction"
 WHERE "legacyAchievementDocumentationTemplateId" IS NOT NULL;

-- 6. Drop the new owner FK columns.
ALTER TABLE "public"."Program"
  DROP CONSTRAINT IF EXISTS "Program_attendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."Program"
  DROP COLUMN IF EXISTS "attendanceCertificateTemplateId";

ALTER TABLE "public"."Course"
  DROP CONSTRAINT IF EXISTS "Course_achievementCertificateTemplateId_fkey",
  DROP CONSTRAINT IF EXISTS "Course_attendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."Course"
  DROP COLUMN IF EXISTS "achievementCertificateTemplateId",
  DROP COLUMN IF EXISTS "attendanceCertificateTemplateId";

ALTER TABLE "public"."ProjectType"
  DROP CONSTRAINT IF EXISTS "ProjectType_certificateTemplateId_fkey";
ALTER TABLE "public"."ProjectType"
  DROP COLUMN IF EXISTS "certificateTemplateId";

-- 7. Drop traceability columns and indexes.
DROP INDEX IF EXISTS "public"."Project_legacyAchievementOptionId_key";
DROP INDEX IF EXISTS "public"."Project_legacyAchievementRecordId_key";
ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP COLUMN IF EXISTS "legacyAchievementDocumentationTemplateId";
ALTER TABLE "public"."Project"
  DROP COLUMN IF EXISTS "legacyAchievementOptionId",
  DROP COLUMN IF EXISTS "legacyAchievementRecordId";

-- 8. Drop the catalog.
DROP TABLE IF EXISTS "public"."CertificateTemplate";
