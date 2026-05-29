-- Reverse the achievement -> project data migration.
--
-- ProjectAuthor.projectId and ProjectCourse.projectId are ON DELETE CASCADE and
-- Project.parentProjectId is ON DELETE SET NULL, so deleting the migrated Project
-- rows removes their authors and course links automatically. Submission projects
-- (legacyAchievementRecordId) are deleted before template projects
-- (legacyAchievementOptionId) so the parent reference is cleared first.
-- ProjectDocumentationInstruction is deleted last because Project references it
-- with ON DELETE RESTRICT.

DELETE FROM "public"."Project"
 WHERE "legacyAchievementRecordId" IS NOT NULL;

DELETE FROM "public"."Project"
 WHERE "legacyAchievementOptionId" IS NOT NULL;

DELETE FROM "public"."ProjectDocumentationInstruction"
 WHERE "legacyAchievementDocumentationTemplateId" IS NOT NULL;

-- Drop the traceability columns and their indexes.
DROP INDEX IF EXISTS "public"."Project_legacyAchievementOptionId_key";
DROP INDEX IF EXISTS "public"."Project_legacyAchievementRecordId_key";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP COLUMN IF EXISTS "legacyAchievementDocumentationTemplateId";

ALTER TABLE "public"."Project"
  DROP COLUMN IF EXISTS "legacyAchievementOptionId",
  DROP COLUMN IF EXISTS "legacyAchievementRecordId";

-- Drop the per-type certificate template column.
ALTER TABLE "public"."ProjectType"
  DROP COLUMN IF EXISTS "certificateTemplateHtml";
