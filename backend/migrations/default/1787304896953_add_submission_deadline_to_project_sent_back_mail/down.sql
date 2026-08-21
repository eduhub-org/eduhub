-- Remove the submission-deadline placeholder from the default send-back template.
UPDATE "public"."MailTemplate"
SET "content" = replace(
      replace(
        "content",
        '[Project:SubmissionDeadline]
  <p>Bitte seht euch die Rückmeldungen an und reicht das Projekt erneut ein:',
        '<p>Bitte seht euch die Rückmeldungen an und reicht das Projekt erneut ein:'
      ),
      '[Project:SubmissionDeadline]
  <p>Please review the feedback and submit again:',
      '<p>Please review the feedback and submit again:'
    ),
    "updated_at" = NOW()
WHERE "type" = 'PROJECT_SENT_BACK'
  AND "courseId" IS NULL;
