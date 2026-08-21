-- Name the (possibly extended) submission deadline in the send-back email.
--
-- ReviewProjectDialog lets instructors extend the deadline while sending a
-- project back for revision, and writes the new deadline before the status
-- change that fires this mail — so the value is already current when
-- sendProjectEmail reads the project back.
--
-- [Project:SubmissionDeadline] expands to a labelled paragraph, or to nothing
-- when no deadline is set, so the template stays correct either way.
--
-- Only the global default template (courseId IS NULL) is touched; course-specific
-- copies stay as their instructors wrote them. The NOT LIKE guard keeps this
-- idempotent and skips templates that already carry the placeholder.
UPDATE "public"."MailTemplate"
SET "content" = replace(
      replace(
        "content",
        '<p>Bitte seht euch die Rückmeldungen an und reicht das Projekt erneut ein:',
        '[Project:SubmissionDeadline]
  <p>Bitte seht euch die Rückmeldungen an und reicht das Projekt erneut ein:'
      ),
      '<p>Please review the feedback and submit again:',
      '[Project:SubmissionDeadline]
  <p>Please review the feedback and submit again:'
    ),
    "updated_at" = NOW()
WHERE "type" = 'PROJECT_SENT_BACK'
  AND "courseId" IS NULL
  AND "content" NOT LIKE '%[Project:SubmissionDeadline]%';
