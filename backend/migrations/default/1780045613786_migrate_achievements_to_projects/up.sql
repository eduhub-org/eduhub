-- =============================================================================
-- Migrate the legacy achievement system to the new project system AND
-- restructure certificate-template ownership scope-by-scope.
--
-- Achievement legacy mapping
--   AchievementOption (template)              -> Project (status = PROPOSED, no authors)
--   AchievementRecord (submission)            -> Project (status = COMPLETED, parentProjectId
--                                                set, ProjectAuthor rows from the record authors)
--   AchievementDocumentationTemplate          -> ProjectDocumentationInstruction
--   AchievementRecordType                     -> ProjectType
--     DOCUMENTATION                           -> CLASSIC_PROJECT
--     ONLINE_COURSE                           -> ONLINE_COURSE
--
-- Certificate-template restructure
--   CertificateTemplateText (typed by certificateType+recordType)
--     -> CertificateTemplate (untyped catalog of named HTML templates)
--   CertificateTemplateProgram (per-program join with two certificateTypes)
--     -> Program.attendanceCertificateTemplateId  (attendance, per program)
--     -> Course.achievementCertificateTemplateId  (achievement overrides, including each degree course's unique HTML)
--   ProjectType.certificateTemplateId          (default achievement template per project type)
--
-- Resolution at render time
--   achievement : Course.achievementCertificateTemplate
--               COALESCE ProjectType[Project.type].certificateTemplate
--   degree      : Course.achievementCertificateTemplate
--               (each degree course owns its unique HTML; no project)
--   attendance  : Course.attendanceCertificateTemplate
--               COALESCE Program.attendanceCertificateTemplate
--
-- Retired tables / columns
--   CertificateTemplateProgram         (per-program join: replaced by FK columns)
--   CertificateTemplateText            (typed catalog: replaced by CertificateTemplate)
--   CertificateType                    (enum: no remaining references)
--   ProjectAchievementCertificateType  (enum: per-project layout selector no longer needed - flavour derives from Project.type)
--   Project.achievementCertificateType (column)
--   Program.achievementCertificateTemplateTextId (dead FK column)
--   Program.attendanceCertificateTemplateTextId  (dead FK column)
--
-- Records whose legacy recordType is neither DOCUMENTATION nor ONLINE_COURSE
-- (only DOCUMENTATION_AND_CSV ever existed, and it was already collapsed to
-- DOCUMENTATION in migration 1769641995649) are skipped by the WHERE clauses.
--
-- The legacy achievement tables themselves (AchievementOption, AchievementRecord,
-- AchievementRecordAuthor, AchievementDocumentationTemplate) are intentionally
-- LEFT IN PLACE and read-only for one release; a follow-up migration drops them
-- together with the temporary legacy* traceability columns added below.
--
-- Every statement is idempotent (IF NOT EXISTS / NOT EXISTS / ON CONFLICT) so
-- the migration can be safely re-applied (useful for re-running the data steps
-- after dev seeds load the legacy fixtures).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. New CertificateTemplate catalog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."CertificateTemplate" (
  "id"          serial      NOT NULL,
  "name"        text        NOT NULL,
  "html"        text        NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("name")
);

COMMENT ON TABLE "public"."CertificateTemplate"
  IS E'Reusable named HTML certificate template (Jinja2). One row per distinct template, referenced by FK from the entity that owns the certificate variant: ProjectType (achievement default per project type), Course (achievement override - this is where each degree course''s unique HTML lives) and Program (attendance default). Replaces the legacy CertificateTemplateText + CertificateTemplateProgram pair.';
COMMENT ON COLUMN "public"."CertificateTemplate"."name"
  IS E'Human-readable, unique identifier (e.g. "Default achievement certificate", "Degree certificate - Digital Innovation").';
COMMENT ON COLUMN "public"."CertificateTemplate"."html"
  IS E'Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations (degree), event_entries (attendance), template (background image).';

CREATE TRIGGER "set_public_CertificateTemplate_updated_at"
  BEFORE UPDATE ON "public"."CertificateTemplate"
  FOR EACH ROW EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CertificateTemplate_updated_at" ON "public"."CertificateTemplate"
  IS 'trigger to set value of column "updated_at" to current timestamp on row update';

-- -----------------------------------------------------------------------------
-- 2. Owner FK columns (all nullable; resolution falls through the chain)
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."ProjectType"
  ADD COLUMN IF NOT EXISTS "certificateTemplateId" integer;

COMMENT ON COLUMN "public"."ProjectType"."certificateTemplateId"
  IS E'Default achievement-certificate template for projects of this type. Used when Course.achievementCertificateTemplateId is NULL on the project''s course.';

ALTER TABLE "public"."ProjectType"
  DROP CONSTRAINT IF EXISTS "ProjectType_certificateTemplateId_fkey";
ALTER TABLE "public"."ProjectType"
  ADD CONSTRAINT "ProjectType_certificateTemplateId_fkey"
  FOREIGN KEY ("certificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "ProjectType_certificateTemplateId_idx"
  ON "public"."ProjectType" ("certificateTemplateId");

ALTER TABLE "public"."Course"
  ADD COLUMN IF NOT EXISTS "achievementCertificateTemplateId" integer,
  ADD COLUMN IF NOT EXISTS "attendanceCertificateTemplateId" integer;

COMMENT ON COLUMN "public"."Course"."achievementCertificateTemplateId"
  IS E'Per-course override for the achievement-certificate template. Takes precedence over ProjectType.certificateTemplateId. For degree courses (Program.shortTitle = ''DEGREES'') this is where each degree''s unique HTML lives.';
COMMENT ON COLUMN "public"."Course"."attendanceCertificateTemplateId"
  IS E'Per-course override for the attendance-certificate template. Takes precedence over Program.attendanceCertificateTemplateId.';

ALTER TABLE "public"."Course"
  DROP CONSTRAINT IF EXISTS "Course_achievementCertificateTemplateId_fkey";
ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_achievementCertificateTemplateId_fkey"
  FOREIGN KEY ("achievementCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE "public"."Course"
  DROP CONSTRAINT IF EXISTS "Course_attendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_attendanceCertificateTemplateId_fkey"
  FOREIGN KEY ("attendanceCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Course_achievementCertificateTemplateId_idx"
  ON "public"."Course" ("achievementCertificateTemplateId");
CREATE INDEX IF NOT EXISTS "Course_attendanceCertificateTemplateId_idx"
  ON "public"."Course" ("attendanceCertificateTemplateId");

ALTER TABLE "public"."Program"
  ADD COLUMN IF NOT EXISTS "attendanceCertificateTemplateId" integer;

COMMENT ON COLUMN "public"."Program"."attendanceCertificateTemplateId"
  IS E'Default attendance-certificate template for courses in this program. Falls back to NULL when no template is configured.';

ALTER TABLE "public"."Program"
  DROP CONSTRAINT IF EXISTS "Program_attendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."Program"
  ADD CONSTRAINT "Program_attendanceCertificateTemplateId_fkey"
  FOREIGN KEY ("attendanceCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Program_attendanceCertificateTemplateId_idx"
  ON "public"."Program" ("attendanceCertificateTemplateId");

-- -----------------------------------------------------------------------------
-- 3. Temporary traceability columns (dropped in the follow-up release)
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."Project"
  ADD COLUMN IF NOT EXISTS "legacyAchievementOptionId" integer,
  ADD COLUMN IF NOT EXISTS "legacyAchievementRecordId" integer;

COMMENT ON COLUMN "public"."Project"."legacyAchievementOptionId"
  IS E'Temporary cut-over trace: id of the AchievementOption this PROPOSED template project was migrated from. Dropped once the legacy achievement tables are removed.';
COMMENT ON COLUMN "public"."Project"."legacyAchievementRecordId"
  IS E'Temporary cut-over trace: id of the AchievementRecord this COMPLETED project was migrated from. Dropped once the legacy achievement tables are removed.';

CREATE UNIQUE INDEX IF NOT EXISTS "Project_legacyAchievementOptionId_key"
  ON "public"."Project" ("legacyAchievementOptionId")
  WHERE "legacyAchievementOptionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Project_legacyAchievementRecordId_key"
  ON "public"."Project" ("legacyAchievementRecordId")
  WHERE "legacyAchievementRecordId" IS NOT NULL;

ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD COLUMN IF NOT EXISTS "legacyAchievementDocumentationTemplateId" integer;

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."legacyAchievementDocumentationTemplateId"
  IS E'Temporary cut-over trace: id of the AchievementDocumentationTemplate this instruction was migrated from. Dropped once the legacy achievement tables are removed.';

-- -----------------------------------------------------------------------------
-- 4. Backfill CertificateTemplate from CertificateTemplateText
--
-- Only runs while the legacy CertificateTemplateText table still exists. After
-- the legacy tables are dropped in step 9, re-runs of the migration skip this
-- block entirely (the to_regclass check returns NULL).
-- Title uniqueness is preserved one-to-one; new ids are assigned by the serial.
-- -----------------------------------------------------------------------------
DO $migrate_templates$
BEGIN
  IF to_regclass('public."CertificateTemplateText"') IS NULL THEN
    RETURN;
  END IF;

  -- Copy templates (title -> name, html copied as-is). ON CONFLICT keeps
  -- idempotency in case the migration was already partially applied.
  EXECUTE $sql$
    INSERT INTO "public"."CertificateTemplate" ("name", "html", "created_at", "updated_at")
    SELECT ctt."title", ctt."html", ctt."created_at", ctt."updated_at"
      FROM "public"."CertificateTemplateText" ctt
    ON CONFLICT ("name") DO NOTHING
  $sql$;

  -- 4a. Attendance: per-program link -> Program.attendanceCertificateTemplateId
  EXECUTE $sql$
    UPDATE "public"."Program" p
       SET "attendanceCertificateTemplateId" = ct.id
      FROM "public"."CertificateTemplateProgram" ctp
      JOIN "public"."CertificateTemplateText"    ctt ON ctt."id"   = ctp."certificateTemplateText"
      JOIN "public"."CertificateTemplate"        ct  ON ct."name"  = ctt."title"
     WHERE ctp."programId" = p."id"
       AND ctt."certificateType" = 'ATTENDANCE'
       AND p."attendanceCertificateTemplateId" IS NULL
  $sql$;

  -- 4b. Achievement: per-program link -> Course.achievementCertificateTemplateId
  --     (each course in the linked program gets the override, including the
  --     degree program's degree courses, whose HTML is unique per degree).
  EXECUTE $sql$
    UPDATE "public"."Course" c
       SET "achievementCertificateTemplateId" = ct.id
      FROM "public"."CertificateTemplateProgram" ctp
      JOIN "public"."CertificateTemplateText"    ctt ON ctt."id"   = ctp."certificateTemplateText"
      JOIN "public"."CertificateTemplate"        ct  ON ct."name"  = ctt."title"
     WHERE ctp."programId" = c."programId"
       AND ctt."certificateType" = 'ACHIEVEMENT'
       AND c."achievementCertificateTemplateId" IS NULL
  $sql$;
END
$migrate_templates$;

-- 4c. ProjectType defaults: every project type's certificateTemplateId points
--     at the migrated achievement template that matches its legacy recordType,
--     falling back to any ACHIEVEMENT template so a fresh database can still
--     issue certificates for the non-legacy project types.
UPDATE "public"."ProjectType" pt
   SET "certificateTemplateId" = (
     SELECT ct.id FROM "public"."CertificateTemplate" ct
       JOIN "public"."CertificateTemplateText" ctt ON ctt."title" = ct."name"
      WHERE ctt."certificateType" = 'ACHIEVEMENT' AND ctt."recordType" = 'ONLINE_COURSE'
      ORDER BY ct.id LIMIT 1
   )
 WHERE pt.value = 'ONLINE_COURSE'
   AND pt."certificateTemplateId" IS NULL
   AND to_regclass('public."CertificateTemplateText"') IS NOT NULL;

UPDATE "public"."ProjectType" pt
   SET "certificateTemplateId" = (
     SELECT ct.id FROM "public"."CertificateTemplate" ct
       JOIN "public"."CertificateTemplateText" ctt ON ctt."title" = ct."name"
      WHERE ctt."certificateType" = 'ACHIEVEMENT' AND ctt."recordType" = 'DOCUMENTATION'
      ORDER BY ct.id LIMIT 1
   )
 WHERE pt.value IN (
         'CLASSIC_PROJECT',
         'PROJECT_WITH_LINK',
         'PROJECT_WITH_PRESENTATION',
         'PROJECT_WITH_LINK_AND_PRESENTATION',
         'PRESENTATION_WITHOUT_DOCUMENTATION',
         'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION'
       )
   AND pt."certificateTemplateId" IS NULL
   AND to_regclass('public."CertificateTemplateText"') IS NOT NULL;

-- Final fallback: any remaining ProjectType without a template picks any ACHIEVEMENT one.
UPDATE "public"."ProjectType" pt
   SET "certificateTemplateId" = (
     SELECT ct.id FROM "public"."CertificateTemplate" ct
       JOIN "public"."CertificateTemplateText" ctt ON ctt."title" = ct."name"
      WHERE ctt."certificateType" = 'ACHIEVEMENT'
      ORDER BY ct.id LIMIT 1
   )
 WHERE pt."certificateTemplateId" IS NULL
   AND to_regclass('public."CertificateTemplateText"') IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. AchievementDocumentationTemplate -> ProjectDocumentationInstruction
--
-- One instruction per (legacy template, mapped project type) actually referenced
-- by a migrated option. The title embeds the legacy id and the type to satisfy
-- the unique(title) constraint even when a single template is reused across
-- types. projectTypeValue must equal the mapped type so that the
-- Project_instruction_matches_type_trg trigger accepts the migrated projects.
-- -----------------------------------------------------------------------------
INSERT INTO "public"."ProjectDocumentationInstruction"
  ("title", "url", "projectTypeValue", "isDefault", "legacyAchievementDocumentationTemplateId")
SELECT DISTINCT
       'Legacy ADT#' || adt.id || ': ' || adt.title || ' [' || m.project_type || ']',
       adt.url,
       m.project_type,
       false,
       adt.id
  FROM "public"."AchievementOption" ao
  JOIN "public"."AchievementDocumentationTemplate" adt
    ON adt.id = ao."achievementDocumentationTemplateId"
  JOIN (VALUES
          ('DOCUMENTATION', 'CLASSIC_PROJECT'),
          ('ONLINE_COURSE', 'ONLINE_COURSE')
       ) AS m(record_type, project_type)
    ON m.record_type = ao."recordType"
 WHERE ao."recordType" IN ('DOCUMENTATION', 'ONLINE_COURSE')
ON CONFLICT ("title") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. AchievementOption -> Project (PROPOSED template, no authors)
--
-- proposedByUserId is NOT NULL but legacy options have no proposer, so we use,
-- in order: the option's first mentor, the first author across the option's
-- records, and finally a deterministic global fallback user (only reachable for
-- options that have neither mentors nor authored records).
-- documentationInstructionId resolves to the legacy-derived instruction when the
-- option had a documentation template, otherwise the per-type default instruction
-- seeded in migration 1779400000000.
-- -----------------------------------------------------------------------------
INSERT INTO "public"."Project"
  ("title", "description", "type", "status",
   "documentationInstructionId", "proposedByUserId", "acceptingParticipants",
   "created_at", "updated_at", "legacyAchievementOptionId")
SELECT
  ao.title,
  ao.description,
  m.project_type,
  'PROPOSED',
  COALESCE(
    (SELECT pdi.id
       FROM "public"."ProjectDocumentationInstruction" pdi
      WHERE pdi."legacyAchievementDocumentationTemplateId" = ao."achievementDocumentationTemplateId"
        AND pdi."projectTypeValue" = m.project_type
      LIMIT 1),
    (SELECT pdi.id
       FROM "public"."ProjectDocumentationInstruction" pdi
      WHERE pdi."projectTypeValue" = m.project_type
        AND pdi."isDefault"
      LIMIT 1)
  ),
  COALESCE(
    (SELECT aom."userId"
       FROM "public"."AchievementOptionMentor" aom
      WHERE aom."achievementOptionId" = ao.id
      ORDER BY aom.id
      LIMIT 1),
    (SELECT ara."userId"
       FROM "public"."AchievementRecordAuthor" ara
       JOIN "public"."AchievementRecord" ar ON ar.id = ara."achievementRecordId"
      WHERE ar."achievementOptionId" = ao.id
      ORDER BY ara.id
      LIMIT 1),
    (SELECT u."id" FROM "public"."User" u ORDER BY u."id" LIMIT 1)
  ),
  true,
  ao.created_at,
  ao.updated_at,
  ao.id
FROM "public"."AchievementOption" ao
JOIN (VALUES
        ('DOCUMENTATION', 'CLASSIC_PROJECT'),
        ('ONLINE_COURSE', 'ONLINE_COURSE')
     ) AS m(record_type, project_type)
  ON m.record_type = ao."recordType"
WHERE ao."recordType" IN ('DOCUMENTATION', 'ONLINE_COURSE')
  AND NOT EXISTS (
        SELECT 1 FROM "public"."Project" p
         WHERE p."legacyAchievementOptionId" = ao.id
      );

-- -----------------------------------------------------------------------------
-- 7. AchievementRecord -> Project (COMPLETED submission)
--
-- Inherits type / documentationInstructionId from the parent template project so
-- the type-match trigger and the Project_ongoing_requires_type_and_instruction_check
-- are satisfied. The legacy rating is carried over only when it is a valid
-- ProjectRating value.
-- -----------------------------------------------------------------------------
INSERT INTO "public"."Project"
  ("title", "description", "coverImageUrl", "documentationUrl", "csvResults",
   "type", "status", "rating",
   "documentationInstructionId", "parentProjectId", "proposedByUserId",
   "acceptingParticipants", "created_at", "updated_at", "legacyAchievementRecordId")
SELECT
  parent.title,
  ar.description,
  ar."coverImageUrl",
  ar."documentationUrl",
  ar."csvResults",
  parent.type,
  'COMPLETED',
  (SELECT pr.value FROM "public"."ProjectRating" pr WHERE pr.value = ar.rating),
  parent."documentationInstructionId",
  parent.id,
  COALESCE(
    (SELECT ara."userId"
       FROM "public"."AchievementRecordAuthor" ara
      WHERE ara."achievementRecordId" = ar.id
      ORDER BY ara.id
      LIMIT 1),
    parent."proposedByUserId"
  ),
  false,
  ar.created_at,
  ar.updated_at,
  ar.id
FROM "public"."AchievementRecord" ar
JOIN "public"."AchievementOption" ao ON ao.id = ar."achievementOptionId"
JOIN "public"."Project" parent ON parent."legacyAchievementOptionId" = ao.id
WHERE ao."recordType" IN ('DOCUMENTATION', 'ONLINE_COURSE')
  AND NOT EXISTS (
        SELECT 1 FROM "public"."Project" p
         WHERE p."legacyAchievementRecordId" = ar.id
      );

-- -----------------------------------------------------------------------------
-- 8. Authors and course links
-- -----------------------------------------------------------------------------
INSERT INTO "public"."ProjectAuthor"
  ("projectId", "userId", "participationStatus", "created_at", "updated_at")
SELECT rp.id, ara."userId", 'ACCEPTED', ara.created_at, ara.updated_at
  FROM "public"."AchievementRecordAuthor" ara
  JOIN "public"."Project" rp ON rp."legacyAchievementRecordId" = ara."achievementRecordId"
ON CONFLICT ("projectId", "userId") DO NOTHING;

INSERT INTO "public"."ProjectCourse" ("projectId", "courseId", "created_at", "updated_at")
SELECT rp.id, ar."courseId", ar.created_at, ar.updated_at
  FROM "public"."AchievementRecord" ar
  JOIN "public"."Project" rp ON rp."legacyAchievementRecordId" = ar.id
 WHERE ar."courseId" IS NOT NULL
ON CONFLICT ("projectId", "courseId") DO NOTHING;

INSERT INTO "public"."ProjectCourse" ("projectId", "courseId", "created_at", "updated_at")
SELECT op.id, aoc."courseId", now(), now()
  FROM "public"."AchievementOptionCourse" aoc
  JOIN "public"."Project" op ON op."legacyAchievementOptionId" = aoc."achievementOptionId"
 WHERE aoc."courseId" IS NOT NULL
ON CONFLICT ("projectId", "courseId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. Drop the retired tables and columns
-- -----------------------------------------------------------------------------
-- Drop dead Program FK columns (never read by application code; the
-- corresponding GraphQL selections are updated in this release).
ALTER TABLE "public"."Program"
  DROP CONSTRAINT IF EXISTS "Program_achievementCertificateTemplateTextId_fkey";
ALTER TABLE "public"."Program"
  DROP CONSTRAINT IF EXISTS "Program_attendanceCertificateTemplateTextId_fkey";
ALTER TABLE "public"."Program"
  DROP COLUMN IF EXISTS "achievementCertificateTemplateTextId",
  DROP COLUMN IF EXISTS "attendanceCertificateTemplateTextId";

-- Drop Project.achievementCertificateType (flavour now derives from Project.type).
ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_achievementCertificateType_fkey";
ALTER TABLE "public"."Project"
  DROP COLUMN IF EXISTS "achievementCertificateType";

DROP TABLE IF EXISTS "public"."ProjectAchievementCertificateType";

-- Drop the legacy template tables.
DROP TABLE IF EXISTS "public"."CertificateTemplateProgram";
DROP TABLE IF EXISTS "public"."CertificateTemplateText";
DROP TABLE IF EXISTS "public"."CertificateType";
