-- =============================================================================
-- Migrate the legacy achievement system to the new project system.
--
-- Legacy  -> New
--   AchievementOption (template)              -> Project (status = PROPOSED, no authors)
--   AchievementRecord (submission)            -> Project (status = COMPLETED, parentProjectId
--                                                set, ProjectAuthor rows from the record authors)
--   AchievementDocumentationTemplate          -> ProjectDocumentationInstruction
--   AchievementRecordType                     -> ProjectType
--     DOCUMENTATION                           -> CLASSIC_PROJECT  (cert type DOCUMENTATION)
--     ONLINE_COURSE                           -> ONLINE_COURSE    (cert type ONLINE_COURSE)
--   CertificateTemplateText.html (per type)   -> ProjectType.certificateTemplateHtml
--
-- Records whose legacy recordType is neither DOCUMENTATION nor ONLINE_COURSE
-- (only DOCUMENTATION_AND_CSV ever existed, and it was already collapsed to
-- DOCUMENTATION in migration 1769641995649) are skipped by the WHERE clauses.
--
-- The legacy tables themselves (AchievementOption, AchievementRecord,
-- AchievementRecordAuthor, AchievementDocumentationTemplate,
-- CertificateTemplateProgram) are intentionally LEFT IN PLACE and read-only for
-- one release; a follow-up migration drops them together with the temporary
-- legacy* traceability columns added below.
--
-- Every statement is idempotent (NOT EXISTS / ON CONFLICT guards) so the
-- migration can be safely re-applied.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Schema: single certificate template per ProjectType
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."ProjectType"
  ADD COLUMN IF NOT EXISTS "certificateTemplateHtml" text;

COMMENT ON COLUMN "public"."ProjectType"."certificateTemplateHtml"
  IS E'Single achievement-certificate HTML template (Jinja2) for this project type, rendered when a completed project of this type issues its achievement certificate. Replaces the per-program CertificateTemplateProgram -> CertificateTemplateText join for project-based (non-degree) achievement certificates. The rendering contract is preserved: variables full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses, practical_project, template (background image). NULL is treated by the certificate function as "fall back to the CLASSIC_PROJECT template".';

-- -----------------------------------------------------------------------------
-- 2. Schema: temporary traceability columns (dropped in the follow-up release)
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
-- 3. Seed ProjectType.certificateTemplateHtml
--
-- Production has manually-inserted CertificateTemplateText rows for the
-- ACHIEVEMENT certificate type with recordType DOCUMENTATION and ONLINE_COURSE.
-- The shipped seed file only contains one ACHIEVEMENT row (id 1, DOCUMENTATION),
-- so dev environments fall back to that single row.
-- -----------------------------------------------------------------------------
UPDATE "public"."ProjectType" pt
   SET "certificateTemplateHtml" = src.html
  FROM (
        SELECT html
          FROM "public"."CertificateTemplateText"
         WHERE "certificateType" = 'ACHIEVEMENT' AND "recordType" = 'ONLINE_COURSE'
         ORDER BY id
         LIMIT 1
       ) src
 WHERE pt.value = 'ONLINE_COURSE'
   AND pt."certificateTemplateHtml" IS NULL;

UPDATE "public"."ProjectType" pt
   SET "certificateTemplateHtml" = src.html
  FROM (
        SELECT html
          FROM "public"."CertificateTemplateText"
         WHERE "certificateType" = 'ACHIEVEMENT' AND "recordType" = 'DOCUMENTATION'
         ORDER BY id
         LIMIT 1
       ) src
 WHERE pt.value = 'CLASSIC_PROJECT'
   AND pt."certificateTemplateHtml" IS NULL;

-- Dev fallback: if the type-specific rows are missing, use any ACHIEVEMENT
-- template (the seed ships id 1) so a fresh database can still issue certificates.
UPDATE "public"."ProjectType" pt
   SET "certificateTemplateHtml" = src.html
  FROM (
        SELECT html
          FROM "public"."CertificateTemplateText"
         WHERE "certificateType" = 'ACHIEVEMENT'
         ORDER BY id
         LIMIT 1
       ) src
 WHERE pt.value IN ('CLASSIC_PROJECT', 'ONLINE_COURSE')
   AND pt."certificateTemplateHtml" IS NULL;

-- The five non-legacy project types have no achievement-system equivalent;
-- per product decision they inherit the CLASSIC_PROJECT template so every type
-- can issue a certificate out of the box. Admins can customize them later.
UPDATE "public"."ProjectType" pt
   SET "certificateTemplateHtml" = src."certificateTemplateHtml"
  FROM (
        SELECT "certificateTemplateHtml"
          FROM "public"."ProjectType"
         WHERE value = 'CLASSIC_PROJECT'
       ) src
 WHERE pt.value IN (
         'PROJECT_WITH_LINK',
         'PROJECT_WITH_PRESENTATION',
         'PROJECT_WITH_LINK_AND_PRESENTATION',
         'PRESENTATION_WITHOUT_DOCUMENTATION',
         'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION'
       )
   AND pt."certificateTemplateHtml" IS NULL;

-- -----------------------------------------------------------------------------
-- 4. Data: AchievementDocumentationTemplate -> ProjectDocumentationInstruction
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
-- 5. Data: AchievementOption -> Project (PROPOSED template, no authors)
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
  ("title", "description", "type", "achievementCertificateType", "status",
   "documentationInstructionId", "proposedByUserId", "acceptingParticipants",
   "created_at", "updated_at", "legacyAchievementOptionId")
SELECT
  ao.title,
  ao.description,
  m.project_type,
  m.cert_type,
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
        ('DOCUMENTATION', 'CLASSIC_PROJECT', 'DOCUMENTATION'),
        ('ONLINE_COURSE', 'ONLINE_COURSE', 'ONLINE_COURSE')
     ) AS m(record_type, project_type, cert_type)
  ON m.record_type = ao."recordType"
WHERE ao."recordType" IN ('DOCUMENTATION', 'ONLINE_COURSE')
  AND NOT EXISTS (
        SELECT 1 FROM "public"."Project" p
         WHERE p."legacyAchievementOptionId" = ao.id
      );

-- -----------------------------------------------------------------------------
-- 6. Data: AchievementRecord -> Project (COMPLETED submission)
--
-- Inherits type / certificate type / documentationInstructionId from the parent
-- template project so the type-match trigger and the
-- Project_ongoing_requires_type_and_instruction_check constraint are satisfied.
-- The legacy rating is carried over only when it is a valid ProjectRating value.
-- -----------------------------------------------------------------------------
INSERT INTO "public"."Project"
  ("title", "description", "coverImageUrl", "documentationUrl", "csvResults",
   "type", "achievementCertificateType", "status", "rating",
   "documentationInstructionId", "parentProjectId", "proposedByUserId",
   "acceptingParticipants", "created_at", "updated_at", "legacyAchievementRecordId")
SELECT
  parent.title,
  ar.description,
  ar."coverImageUrl",
  ar."documentationUrl",
  ar."csvResults",
  parent.type,
  parent."achievementCertificateType",
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
-- 7. Data: AchievementRecordAuthor -> ProjectAuthor (ACCEPTED)
-- -----------------------------------------------------------------------------
INSERT INTO "public"."ProjectAuthor"
  ("projectId", "userId", "participationStatus", "created_at", "updated_at")
SELECT rp.id, ara."userId", 'ACCEPTED', ara.created_at, ara.updated_at
  FROM "public"."AchievementRecordAuthor" ara
  JOIN "public"."Project" rp ON rp."legacyAchievementRecordId" = ara."achievementRecordId"
ON CONFLICT ("projectId", "userId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. Data: course links -> ProjectCourse
--    8a. submission projects from AchievementRecord.courseId
--    8b. template projects from AchievementOptionCourse
-- -----------------------------------------------------------------------------
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
