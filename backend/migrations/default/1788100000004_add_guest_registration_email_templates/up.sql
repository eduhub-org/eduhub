-- Email templates for guest (account-less) event registration.
--
-- Only two new templates are needed. Everything after confirmation reuses the
-- existing lifecycle templates (REGISTRATION_CONFIRMED, SESSION_REMINDER,
-- SESSION_RESCHEDULED, ENROLLMENT_CANCELLED), because a guest is an ordinary
-- User row and those mails already resolve their recipient via CourseEnrollment.User.
--
-- Both are bilingual in a single body, following the ORGANIZER_ADDED model.

-- 1. Register the new MailTemplateType enum values
INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES
  ('GUEST_REGISTRATION_CONFIRM', 'Double opt-in mail asking a guest to confirm their event registration and email address'),
  ('GUEST_ALREADY_HAS_ACCOUNT', 'Sent when someone uses the guest form with an email address that already belongs to a registered account')
ON CONFLICT ("value") DO NOTHING;

-- 2. Seed default templates (idempotent per type)

-- GUEST_REGISTRATION_CONFIRM
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'GUEST_REGISTRATION_CONFIRM', NULL,
  'Bitte bestätige deine Anmeldung / Please confirm your registration - [Guest:CourseName]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>du hast dich für <strong>[Guest:CourseName]</strong> angemeldet. Bitte bestätige deine Anmeldung über den folgenden Link:</p>
  <p><a href="[Guest:ConfirmLink]">Anmeldung bestätigen</a></p>
  <p>Der Link ist 7 Tage gültig. Erst nach der Bestätigung ist deine Anmeldung gültig.</p>
  <p>Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach – ohne Bestätigung speichern wir deine Daten nicht dauerhaft.</p>
  <p>Wir speichern deinen Namen und deine E-Mail-Adresse, um die Veranstaltung durchzuführen und dich über Änderungen zu informieren. Nach Ablauf der in unserer <a href="[Guest:PrivacyPolicyLink]">Datenschutzerklärung</a> genannten Frist löschen wir sie automatisch.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>You registered for <strong>[Guest:CourseName]</strong>. Please confirm your registration using the link below:</p>
  <p><a href="[Guest:ConfirmLink]">Confirm registration</a></p>
  <p>The link is valid for 7 days. Your registration only becomes valid once confirmed.</p>
  <p>If you did not register, simply ignore this email — without confirmation we do not keep your data.</p>
  <p>We store your name and email address in order to run the event and to inform you about changes to it. We delete them automatically once the period stated in our <a href="[Guest:PrivacyPolicyLink]">privacy policy</a> has passed.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'GUEST_REGISTRATION_CONFIRM' AND "courseId" IS NULL);

-- GUEST_ALREADY_HAS_ACCOUNT
-- Sent instead of creating a guest record when the address belongs to a real
-- account. The guest form's API response is identical either way, so this mail
-- is the only place the difference is visible - and it only reaches the address
-- owner, which is what keeps the form from being used to probe for accounts.
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'GUEST_ALREADY_HAS_ACCOUNT', NULL,
  'Du hast bereits ein Konto / You already have an account - [Guest:CourseName]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo,</p>
  <p>für <strong>[Guest:CourseName]</strong> wurde eine Gast-Anmeldung mit dieser E-Mail-Adresse versucht. Zu dieser Adresse gibt es bereits ein EduHub-Konto.</p>
  <p>Bitte melde dich an und schließe die Anmeldung in deinem Konto ab:</p>
  <p><a href="[Guest:LoginLink]">Zur Veranstaltung</a></p>
  <p>Falls du das nicht warst, musst du nichts tun – es wurde nichts geändert und keine Anmeldung angelegt.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello,</p>
  <p>Someone tried to register as a guest for <strong>[Guest:CourseName]</strong> with this email address. An EduHub account already exists for it.</p>
  <p>Please log in and complete your registration from your account:</p>
  <p><a href="[Guest:LoginLink]">Go to the event</a></p>
  <p>If this was not you, there is nothing to do — nothing was changed and no registration was created.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'GUEST_ALREADY_HAS_ACCOUNT' AND "courseId" IS NULL);
