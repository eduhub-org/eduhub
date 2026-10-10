ALTER TABLE "public"."Program"
  ADD COLUMN "instructorCertificateTemplateId" integer;

ALTER TABLE "public"."Program"
  ADD CONSTRAINT "Program_instructorCertificateTemplateId_fkey"
  FOREIGN KEY ("instructorCertificateTemplateId") REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

COMMENT ON COLUMN "public"."Program"."instructorCertificateTemplateId" IS E'HTML template (type INSTRUCTOR_CERTIFICATE) for the certificates confirming that someone instructed a course of this program.';

ALTER TABLE "public"."CourseInstructor"
  ADD COLUMN "certificateURL" text;

COMMENT ON COLUMN "public"."CourseInstructor"."certificateURL" IS E'Bucket path of the instructor certificate for this course; setting it the first time mails the instructor (INSTRUCTOR_CERTIFICATE_READY).';

-- Hasura delivers events at least once and retries failed queueing; the mail carries the
-- CourseInstructor id under its own metadata key so it can be queued only once. A separate key
-- (not courseInstructorId) keeps it independent of MailLog_organizer_added_mail_unique.
CREATE UNIQUE INDEX "MailLog_instructor_certificate_mail_unique"
  ON "public"."MailLog" ((metadata ->> 'instructorCertificateCourseInstructorId'))
  WHERE metadata ? 'instructorCertificateCourseInstructorId';

INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('INSTRUCTOR_CERTIFICATE_READY', 'Sent when an instructor certificate has been issued for a course')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at")
SELECT
  'INSTRUCTOR_CERTIFICATE_READY',
  NULL,
  'Dein Zertifikat als Kursleitung / Your instructor certificate - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName],</p>
  <p>vielen Dank, dass Du <strong>[Enrollment:CourseId--Course:Name]</strong> geleitet hast! Dein Zertifikat als Kursleitung ist jetzt fertig.</p>
  <p>Du kannst es auf der Verwaltungsseite des Kurses im Bereich „Kursteam“ herunterladen: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />

  <!-- English -->
  <p>Hello [User:FirstName],</p>
  <p>thank you for instructing <strong>[Enrollment:CourseId--Course:Name]</strong>! Your instructor certificate is now ready.</p>
  <p>You can download it in the "Course team" section of the course management page: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh',
  NULL,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MailTemplate"
  WHERE "type" = 'INSTRUCTOR_CERTIFICATE_READY' AND "courseId" IS NULL
);
