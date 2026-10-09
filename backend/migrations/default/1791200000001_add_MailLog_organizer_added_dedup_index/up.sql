-- Hasura retries the send_organizer_added_email event when queueing fails,
-- and delivers events at least once anyway. The handler tags its mail with the
-- CourseInstructor id, and this index makes a second copy impossible. Partial,
-- like MailLog_job_posting_mail_unique, so other mails are unaffected.
CREATE UNIQUE INDEX "MailLog_organizer_added_mail_unique"
  ON "public"."MailLog" ((metadata ->> 'courseInstructorId'))
  WHERE metadata ? 'courseInstructorId';
