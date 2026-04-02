INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('WAITLIST_NOTICE', 'Sent when a user joins the waitlist because the course is full')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("subject", "content", "from", "type", "courseId")
SELECT
  'Waitlist Confirmation - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
  <html>
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <body>
      <p>Hello [User:Firstname] [User:LastName],</p>
      <p>Thank you for your interest in <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
      <p>The course is currently full. We have placed you on the waitlist.</p>
      <p>You can only participate if a spot becomes available. If that happens, we will contact you with further information.</p>
      <p>If you do not receive another message, participation is not possible. Please refrain from enquiries in the meantime.</p>
      <p>You can view your enrollment status here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
      <p>Best regards,<br>The EduHub Team</p>
    </body>
  </html>',
  'noreply@opencampus.sh',
  'WAITLIST_NOTICE',
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."MailTemplate"
  WHERE "type" = 'WAITLIST_NOTICE' AND "courseId" IS NULL
);
