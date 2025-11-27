-- First, insert USER_CREATED into MailTemplateType enum table
INSERT INTO "public"."MailTemplateType" ("value", "comment") 
VALUES ('USER_CREATED', 'Sent when an admin creates a new user account')
ON CONFLICT ("value") DO NOTHING;

-- Insert USER_CREATED email template (default template with courseId = NULL)
-- Only one default template per type is allowed (unique constraint)
-- Using German as default, can be updated later if needed
-- Check if template already exists before inserting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."MailTemplate" 
    WHERE "type" = 'USER_CREATED' AND "courseId" IS NULL
  ) THEN
    INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at")
    VALUES (
      'USER_CREATED',
      NULL,
      'Willkommen bei EduHub - Dein Account wurde erstellt',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <p>Hallo [User:Firstname] [User:LastName],</p>
  
  <p>Dein Account wurde für die EduHub-Plattform erstellt. Du kannst jetzt ein Passwort für deinen Account festlegen und dich anmelden.</p>
  
  <p>Um dein Passwort zu setzen, klicke bitte auf den folgenden Link:</p>
  <p><a href="[System:PasswordResetLink]">Passwort setzen</a></p>
  
  <p>Falls der Link nicht funktioniert, kopiere diese URL in deinen Browser:</p>
  <p>[System:PasswordResetLink]</p>
  
  <p>Die Passwort-Setzung ist optional. Du kannst den Account auch ohne Passwort nutzen, falls du nur als Referent oder eingeladene Person tätig bist.</p>
  
  <p>Du kannst dich hier anmelden: <a href="[System:PortalUrl]">[System:PortalUrl]</a></p>
  
  <p>Viele Grüße,<br>Dein EduHub Team</p>
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

