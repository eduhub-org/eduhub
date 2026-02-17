-- Insert ORGANIZER_ADDED into MailTemplateType enum table
INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('ORGANIZER_ADDED', 'Sent when a user is added as an organizer to a course or event')
ON CONFLICT ("value") DO NOTHING;

-- Insert ORGANIZER_ADDED email template (default template with courseId = NULL)
-- Uses "Organisator" terminology to cover both courses and events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."MailTemplate"
    WHERE "type" = 'ORGANIZER_ADDED' AND "courseId" IS NULL
  ) THEN
    INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at")
    VALUES (
      'ORGANIZER_ADDED',
      NULL,
      'Du wurdest als Organisator hinzugefügt / You have been added as organizer - [Enrollment:CourseId--Course:Name]',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- German -->
  <p>Hallo [User:Firstname] [User:LastName],</p>
  <p>Du wurdest als Organisator für <strong>[Enrollment:CourseId--Course:Name]</strong> hinzugefügt.</p>
  <p>Du kannst den Kurs bzw. das Event hier verwalten: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Bei Fragen wende dich bitte an die Plattform-Administration.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />

  <!-- English -->
  <p>Hello [User:Firstname] [User:LastName],</p>
  <p>You have been added as an organizer for <strong>[Enrollment:CourseId--Course:Name]</strong>.</p>
  <p>You can manage the course or event here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>If you have any questions, please contact the platform administration.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
      'noreply@opencampus.sh',
      NULL,
      NULL,
      NOW(),
      NOW()
    );
  END IF;
END $$;
