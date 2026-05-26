CREATE TABLE "public"."ProjectType" (
  "value" text NOT NULL,
  "comment" text,
  "requiresDocumentation" boolean NOT NULL DEFAULT true,
  "requiresPresentation" boolean NOT NULL DEFAULT false,
  "requiresExternalUrl" boolean NOT NULL DEFAULT false,
  "requiresCoverImage" boolean NOT NULL DEFAULT false,
  "requiresEvaluationScript" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("value")
);
COMMENT ON TABLE "public"."ProjectType" IS E'Project content-requirement profile. The boolean flags drive UI validation and the server-side completion check; certificate layout is governed by ProjectAchievementCertificateType, not this table.';

INSERT INTO "public"."ProjectType"("value", "comment", "requiresDocumentation", "requiresPresentation", "requiresExternalUrl", "requiresCoverImage", "requiresEvaluationScript") VALUES
  (E'DOCUMENTATION', E'Standard documented project; only a documentation upload is required.', true, false, false, false, false),
  (E'ONLINE_COURSE', E'Completion of an online course; a documentation upload is still required (e.g. course certificate).', true, false, false, false, false),
  (E'DOCUMENTATION_AND_PRESENTATION', E'Documented project that also requires a presentation upload.', true, true, false, false, false),
  (E'PROJECT', E'Praxis-style project requiring documentation, presentation, and a cover image for showcase.', true, true, false, true, false),
  (E'OPEN_PROJECT', E'Open / community project that publishes a public site or repository in addition to documentation, presentation, and cover image.', true, true, true, true, false);
