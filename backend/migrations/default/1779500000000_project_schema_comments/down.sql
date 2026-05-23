-- Revert comment-only migration 1779500000000_project_schema_comments.

COMMENT ON TABLE "public"."ProjectType" IS
  'Project content-requirement profile. The boolean flags drive UI validation and the server-side completion check; certificate layout is governed by ProjectAchievementCertificateType, not this table.';

COMMENT ON COLUMN "public"."ProjectType"."comment" IS NULL;
COMMENT ON COLUMN "public"."ProjectType"."requiresDocumentation" IS NULL;
COMMENT ON COLUMN "public"."ProjectType"."requiresPresentation" IS NULL;
COMMENT ON COLUMN "public"."ProjectType"."requiresExternalUrl" IS NULL;
COMMENT ON COLUMN "public"."ProjectType"."requiresCoverImage" IS NULL;

UPDATE "public"."ProjectType" SET "comment" = 'Completion of an online course; a documentation upload is still required (e.g. course certificate).'
  WHERE "value" = 'ONLINE_COURSE';

UPDATE "public"."ProjectType" SET "comment" = 'Classic project: only a documentation upload is required.'
  WHERE "value" = 'CLASSIC_PROJECT';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: requires documentation, cover image, and an external link (e.g. repository).'
  WHERE "value" = 'PROJECT_WITH_LINK';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: requires documentation, cover image, and a presentation upload.'
  WHERE "value" = 'PROJECT_WITH_PRESENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: requires documentation, cover image, presentation upload, and an external link.'
  WHERE "value" = 'PROJECT_WITH_LINK_AND_PRESENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: presentation and cover image; documentation upload is optional.'
  WHERE "value" = 'PRESENTATION_WITHOUT_DOCUMENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: presentation, external link, and cover image; documentation upload is optional.'
  WHERE "value" = 'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION';

COMMENT ON TABLE "public"."ProjectAchievementCertificateType" IS
  'Layout selector for the achievement certificate generated when a project is completed. EduHub also issues attendance certificates, which are unrelated to this table.';

COMMENT ON COLUMN "public"."ProjectAchievementCertificateType"."comment" IS NULL;

UPDATE "public"."ProjectAchievementCertificateType" SET "comment" = 'Documentation-style achievement certificate.'
  WHERE "value" = 'DOCUMENTATION';

UPDATE "public"."ProjectAchievementCertificateType" SET "comment" = 'Online-course completion certificate layout.'
  WHERE "value" = 'ONLINE_COURSE';

COMMENT ON TABLE "public"."ProjectDocumentationInstruction" IS
  'Reusable documentation instruction (PDF or similar) referenced by Project.documentationInstructionId. Each entry describes how the project documentation (or any other mandatory deliverables) should be composed; in some cases (e.g. reflection questionnaires for online courses) it is a fillable PDF that can be completed directly.';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."title" IS NULL;
COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."url" IS NULL;

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."projectTypeValue" IS
  'The single project type this instruction is suitable for.';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."isDefault" IS
  'Exactly one instruction per projectTypeValue is marked default; admin UI swaps defaults atomically.';

COMMENT ON TABLE "public"."ProjectMentor" IS
  'Mentor assigned to a project. Mirrors AchievementOptionMentor; mentors are independent of the implementing-author lifecycle and survive copies from a template to a claimed project.';

COMMENT ON COLUMN "public"."ProjectMentor"."projectId" IS NULL;
COMMENT ON COLUMN "public"."ProjectMentor"."userId" IS NULL;

COMMENT ON COLUMN "public"."Project"."type" IS NULL;
COMMENT ON COLUMN "public"."Project"."documentationInstructionId" IS NULL;
COMMENT ON COLUMN "public"."Project"."achievementCertificateType" IS NULL;

COMMENT ON COLUMN "public"."Project"."ratingComment" IS
  'Optional instructor comment accompanying the project rating (UNRATED/PASSED/FAILED).';
