DROP TRIGGER IF EXISTS "course_enrollment_guard_participant_changes" ON "public"."CourseEnrollment";
DROP FUNCTION IF EXISTS "public"."course_enrollment_guard_participant_changes"();

DELETE FROM "public"."MailTemplate"
WHERE "type" IN ('CANCELLATION_REQUEST_ORGANIZER', 'CANCELLATION_REQUEST_CONFIRMATION') AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType"
WHERE "value" IN ('CANCELLATION_REQUEST_ORGANIZER', 'CANCELLATION_REQUEST_CONFIRMATION')
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = "MailTemplateType"."value");

ALTER TABLE "public"."CourseEnrollment"
  DROP COLUMN IF EXISTS "cancellationRequestReason",
  DROP COLUMN IF EXISTS "cancellationRequestedAt";
