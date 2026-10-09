ALTER TABLE "public"."CourseEnrollment"
  ADD COLUMN "questionnaireResponse" jsonb NULL;

COMMENT ON COLUMN "public"."CourseEnrollment"."questionnaireResponse" IS
  'Stored application questionnaire response. The "provider" key names the questionnaire tool (currently "formbricks"), "formatVersion" the JSON layout. Filled on demand from the applications tab and nightly by the sync_formbricks_responses cron. NULL = not fetched yet.';
