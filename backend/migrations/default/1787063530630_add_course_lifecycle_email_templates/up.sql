-- Course/event lifecycle email templates (completion via certificate, cancellation,
-- abort, waitlist promotion, invitation expiry). All default templates (courseId = NULL)
-- and bilingual (German + English) in a single body, following the ORGANIZER_ADDED model.

-- 1. Register the new MailTemplateType enum values
INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES
  ('CERTIFICATE_ACHIEVEMENT_READY', 'Sent when an achievement certificate is issued for an enrollment (also signals course completion)'),
  ('CERTIFICATE_ATTENDANCE_READY', 'Sent when an attendance certificate is issued for an enrollment (also signals course completion)'),
  ('ENROLLMENT_CANCELLED', 'Sent when an enrollment is cancelled'),
  ('ENROLLMENT_ABORTED', 'Sent when an enrollment is aborted (course not successfully completed)'),
  ('WAITLIST_PROMOTED', 'Sent when a waitlisted user is promoted (a spot became available)'),
  ('INVITATION_EXPIRING_SOON', 'Reminder sent shortly before a course invitation expires'),
  ('INVITATION_EXPIRED', 'Sent when a course invitation has expired')
ON CONFLICT ("value") DO NOTHING;

-- 2. Seed default templates (idempotent per type)

-- CERTIFICATE_ACHIEVEMENT_READY
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'CERTIFICATE_ACHIEVEMENT_READY', NULL,
  'Dein Leistungszertifikat ist da / Your achievement certificate is ready - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>Herzlichen Glückwunsch! Du hast <strong>[Enrollment:CourseId--Course:Name]</strong> erfolgreich abgeschlossen und dein Leistungszertifikat steht bereit.</p>
  <p>Du kannst es hier abrufen: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Congratulations! You have successfully completed <strong>[Enrollment:CourseId--Course:Name]</strong>, and your achievement certificate is ready.</p>
  <p>You can access it here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'CERTIFICATE_ACHIEVEMENT_READY' AND "courseId" IS NULL);

-- CERTIFICATE_ATTENDANCE_READY
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'CERTIFICATE_ATTENDANCE_READY', NULL,
  'Deine Teilnahmebescheinigung ist da / Your attendance certificate is ready - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>Deine Teilnahmebescheinigung für <strong>[Enrollment:CourseId--Course:Name]</strong> steht bereit.</p>
  <p>Du kannst sie hier abrufen: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your attendance certificate for <strong>[Enrollment:CourseId--Course:Name]</strong> is ready.</p>
  <p>You can access it here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'CERTIFICATE_ATTENDANCE_READY' AND "courseId" IS NULL);

-- ENROLLMENT_CANCELLED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'ENROLLMENT_CANCELLED', NULL,
  'Deine Anmeldung wurde storniert / Your enrollment has been cancelled - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>Deine Anmeldung für <strong>[Enrollment:CourseId--Course:Name]</strong> wurde storniert.</p>
  <p>Falls das nicht beabsichtigt war, kannst du dich hier erneut anmelden: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your enrollment for <strong>[Enrollment:CourseId--Course:Name]</strong> has been cancelled.</p>
  <p>If this was not intended, you can re-register here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'ENROLLMENT_CANCELLED' AND "courseId" IS NULL);

-- ENROLLMENT_ABORTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'ENROLLMENT_ABORTED', NULL,
  'Zu deiner Teilnahme / Regarding your participation - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>deine Teilnahme an <strong>[Enrollment:CourseId--Course:Name]</strong> wurde als nicht erfolgreich abgeschlossen markiert.</p>
  <p>Bei Fragen wende dich bitte an das Kursteam. Du findest den Kurs hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your participation in <strong>[Enrollment:CourseId--Course:Name]</strong> has been marked as not successfully completed.</p>
  <p>If you have any questions, please contact the course team. You can find the course here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'ENROLLMENT_ABORTED' AND "courseId" IS NULL);

-- WAITLIST_PROMOTED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'WAITLIST_PROMOTED', NULL,
  'Ein Platz ist frei geworden / A spot has opened up - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>gute Nachrichten! Für <strong>[Enrollment:CourseId--Course:Name]</strong> ist ein Platz frei geworden und du bist von der Warteliste nachgerückt.</p>
  <p>Bitte bestätige deine Teilnahme hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Good news! A spot has opened up for <strong>[Enrollment:CourseId--Course:Name]</strong> and you have been moved up from the waitlist.</p>
  <p>Please confirm your participation here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'WAITLIST_PROMOTED' AND "courseId" IS NULL);

-- INVITATION_EXPIRING_SOON
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'INVITATION_EXPIRING_SOON', NULL,
  'Deine Einladung läuft bald ab / Your invitation expires soon - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>deine Einladung zu <strong>[Enrollment:CourseId--Course:Name]</strong> läuft am [Enrollment:ExpirationDate] ab.</p>
  <p>Bitte bestätige deine Teilnahme rechtzeitig hier: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your invitation to <strong>[Enrollment:CourseId--Course:Name]</strong> expires on [Enrollment:ExpirationDate].</p>
  <p>Please confirm your participation in time here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'INVITATION_EXPIRING_SOON' AND "courseId" IS NULL);

-- INVITATION_EXPIRED
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'INVITATION_EXPIRED', NULL,
  'Deine Einladung ist abgelaufen / Your invitation has expired - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>deine Einladung zu <strong>[Enrollment:CourseId--Course:Name]</strong> ist leider abgelaufen.</p>
  <p>Falls du weiterhin interessiert bist, wende dich bitte an das Kursteam oder sieh dir den Kurs hier an: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Unfortunately, your invitation to <strong>[Enrollment:CourseId--Course:Name]</strong> has expired.</p>
  <p>If you are still interested, please contact the course team or view the course here: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'INVITATION_EXPIRED' AND "courseId" IS NULL);
