-- Document project-type, documentation-instruction, and mentor semantics for
-- Hasura console / schema explorers. No data or constraint changes.

-- ---------------------------------------------------------------------------
-- ProjectType
-- ---------------------------------------------------------------------------

COMMENT ON TABLE "public"."ProjectType" IS
  'Catalog of project requirement profiles. Each row defines which deliverables are mandatory for completion (requires* flags, enforced in UI and submission checks). Three concerns: (1) mandatory upload/link/cover fields; (2) staff confirmation of proposed teams before ONGOING (ONLINE_COURSE templates claimed via copyProjectFromTemplate start ONGOING without that step); (3) publishable showcase flows vs documentation-only. Achievement certificate PDF layout is on Project.achievementCertificateType, not here. Additional sub-task wording (e.g. reflection forms, zip bundles) lives in ProjectDocumentationInstruction PDFs only—not as extra enforced checklist fields.';

COMMENT ON COLUMN "public"."ProjectType"."comment" IS
  'Short human-readable summary of this type for admins and instructors (also surfaced in UI type descriptions).';

COMMENT ON COLUMN "public"."ProjectType"."requiresDocumentation" IS
  'When true, project.documentationUrl must be present before the project can be submitted.';

COMMENT ON COLUMN "public"."ProjectType"."requiresPresentation" IS
  'When true, project.presentationUrl must be present before the project can be submitted.';

COMMENT ON COLUMN "public"."ProjectType"."requiresExternalUrl" IS
  'When true, project.externalUrl must be present before the project can be submitted (e.g. repository or live demo).';

COMMENT ON COLUMN "public"."ProjectType"."requiresCoverImage" IS
  'When true, project.coverImageUrl must be present before submission and for showcase publication.';

UPDATE "public"."ProjectType" SET "comment" = 'Online course: documentation upload required (e.g. course certificate or fillable reflection PDF). Template copies start ONGOING without instructor team confirmation; metadata is taken from the template.'
  WHERE "value" = 'ONLINE_COURSE';

UPDATE "public"."ProjectType" SET "comment" = 'Classic project: only a documentation upload is required.'
  WHERE "value" = 'CLASSIC_PROJECT';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: documentation, cover image, and external link (e.g. repository or live demo) are required.'
  WHERE "value" = 'PROJECT_WITH_LINK';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: documentation, cover image, and presentation upload are required.'
  WHERE "value" = 'PROJECT_WITH_PRESENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: documentation, cover image, presentation, and external link are required.'
  WHERE "value" = 'PROJECT_WITH_LINK_AND_PRESENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: presentation and cover image are required; documentation upload is optional (instruction PDF may still describe optional written work).'
  WHERE "value" = 'PRESENTATION_WITHOUT_DOCUMENTATION';

UPDATE "public"."ProjectType" SET "comment" = 'Publishable project: presentation, cover image, and external link are required; documentation upload is optional.'
  WHERE "value" = 'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION';

-- ---------------------------------------------------------------------------
-- ProjectAchievementCertificateType
-- ---------------------------------------------------------------------------

COMMENT ON TABLE "public"."ProjectAchievementCertificateType" IS
  'Layout selector for the achievement certificate generated when a project is completed. Distinct from ProjectType (deliverable requirements). EduHub course-level achievement certificates (AchievementOption.recordType) use a separate code path.';

COMMENT ON COLUMN "public"."ProjectAchievementCertificateType"."comment" IS
  'Human-readable note for this certificate layout variant.';

UPDATE "public"."ProjectAchievementCertificateType" SET "comment" = 'Standard project achievement certificate layout (practical/documentation projects).'
  WHERE "value" = 'DOCUMENTATION';

UPDATE "public"."ProjectAchievementCertificateType" SET "comment" = 'Online-course achievement certificate layout (differs from other project types).'
  WHERE "value" = 'ONLINE_COURSE';

-- ---------------------------------------------------------------------------
-- ProjectDocumentationInstruction
-- ---------------------------------------------------------------------------

COMMENT ON TABLE "public"."ProjectDocumentationInstruction" IS
  'Per–project-type documentation instructions (usually a PDF). Referenced by Project.documentationInstructionId. Describes how participants should compose mandatory deliverables; may be fillable (e.g. online-course reflection). Does not add extra enforced upload fields beyond ProjectType requires* flags—only narrative/process detail. Exactly one row per projectTypeValue may be isDefault; admin UI promotes defaults atomically.';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."title" IS
  'Admin-facing label in instruction dropdowns.';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."url" IS
  'Instruction PDF location: static app path (e.g. /project-documentation-instructions/…) or GCS object path after admin upload. Nullable until a file is attached.';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."projectTypeValue" IS
  'FK to ProjectType.value. Every instruction belongs to exactly one type; must match Project.type when linked (see Project_instruction_matches_type_trg).';

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."isDefault" IS
  'When true, this instruction is the default for its projectTypeValue (at most one per type; partial unique index). Shown first in dropdowns and applied when the project type changes.';

-- ---------------------------------------------------------------------------
-- ProjectMentor
-- ---------------------------------------------------------------------------

COMMENT ON TABLE "public"."ProjectMentor" IS
  'User assigned as mentor on a project. Grants the same Hasura instructor_access project permissions as course instructors for that row (view details, set rating/ratingComment, etc.) via ProjectMentors filters—not global admin access. Rows are copied from templates when participants claim a project. Mentors are not listed on achievement certificates (legacy behaviour removed).';

COMMENT ON COLUMN "public"."ProjectMentor"."projectId" IS
  'FK to Project.id.';

COMMENT ON COLUMN "public"."ProjectMentor"."userId" IS
  'FK to User.id of the mentor.';

-- ---------------------------------------------------------------------------
-- Project (columns added or central to this branch)
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN "public"."Project"."type" IS
  'FK to ProjectType.value. Required with documentationInstructionId before leaving PROPOSED (check constraint). Drives mandatory deliverables and workflow (e.g. ONLINE_COURSE template claim may insert ONGOING directly).';

COMMENT ON COLUMN "public"."Project"."documentationInstructionId" IS
  'FK to ProjectDocumentationInstruction.id. Must match Project.type (trigger Project_instruction_matches_type_trg). Instruction PDF describes deliverable composition; enforced uploads are only those required by the project type.';

COMMENT ON COLUMN "public"."Project"."achievementCertificateType" IS
  'FK to ProjectAchievementCertificateType.value. Certificate layout when the project is completed; independent of Project.type deliverable flags.';

COMMENT ON COLUMN "public"."Project"."ratingComment" IS
  'Optional comment from course staff or project mentor accompanying rating (UNRATED/PASSED/FAILED).';
