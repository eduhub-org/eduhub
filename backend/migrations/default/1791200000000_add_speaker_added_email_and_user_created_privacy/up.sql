-- Speakers and accounts created by organizers are personal data we did not
-- collect from the person themselves (GDPR Art. 14), so both now tell them
-- what is stored and published and link the privacy policy.

-- 1. SESSION_SPEAKER_ADDED: sent the first time someone is listed as a speaker
--    in a course (see functions/callNodeFunction/sendSpeakerAddedEmail).
INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES ('SESSION_SPEAKER_ADDED', 'Sent when a user is first listed as a speaker in a course or event')
ON CONFLICT ("value") DO NOTHING;

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'SESSION_SPEAKER_ADDED', NULL,
  'Du bist als Referent*in eingetragen / You are listed as a speaker - [Enrollment:CourseId--Course:Name]',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>die Organisation von <strong>[Enrollment:CourseId--Course:Name]</strong> hat dich auf EduHub als Referent*in eingetragen. Auf der öffentlichen Seite des Angebots werden dein Name und – falls vorhanden – dein Profilbild und dein Profil-Link angezeigt:</p>
  <p><a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Du möchtest ein Foto hinzufügen oder deine Angaben ändern? Melde dich an und bearbeite <a href="[System:PortalUrl]/profile">dein Profil</a>. Falls du noch kein Passwort hast, kannst du beim Anmelden über „Passwort vergessen?“ eines festlegen.</p>
  <p>Wenn du nicht als Referent*in genannt werden möchtest, wende dich an die Organisator*innen des Angebots oder an uns. Welche Daten wir zu welchem Zweck verarbeiten, wie du uns erreichst und welche Rechte du hast, steht in unserer <a href="[System:PrivacyPolicyLink]">Datenschutzerklärung</a>.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>The organizers of <strong>[Enrollment:CourseId--Course:Name]</strong> have listed you as a speaker on EduHub. The public page of the offering shows your name and, if available, your profile picture and profile link:</p>
  <p><a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
  <p>Want to add a photo or change your details? Log in and edit <a href="[System:PortalUrl]/profile">your profile</a>. If you have no password yet, you can set one via “Forgot password?” on the login page.</p>
  <p>If you do not want to be listed as a speaker, please contact the organizers of the offering or us. Our <a href="[System:PrivacyPolicyLink]">privacy policy</a> explains which data we process and why, how to reach us and what your rights are.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  'noreply@opencampus.sh', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'SESSION_SPEAKER_ADDED' AND "courseId" IS NULL);

-- 2. USER_CREATED: now always sent (createUser no longer has an opt-out), so
--    it carries the privacy notice. Also fixes [User:Firstname], which never
--    matched the [User:FirstName] placeholder and showed up literally.
--    Only the untouched seed is replaced; a template already edited in the
--    settings keeps its text and gets the privacy notice appended below.
UPDATE "public"."MailTemplate"
SET
  "subject" = 'Willkommen bei EduHub - Dein Account wurde erstellt / Welcome to EduHub - Your account has been created',
  "content" = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- German -->
  <p>Hallo [User:FirstName] [User:LastName],</p>
  <p>für dich wurde ein Account auf der EduHub-Plattform angelegt, zum Beispiel weil du als Referent*in oder Organisator*in eines Angebots eingetragen wurdest.</p>
  <p>Um dich anzumelden, lege bitte ein Passwort fest:</p>
  <p><a href="[System:PasswordResetLink]">Passwort festlegen</a></p>
  <p>Falls der Link nicht funktioniert, kopiere diese URL in deinen Browser:<br>[System:PasswordResetLink]</p>
  <p>Danach kannst du dich hier anmelden: <a href="[System:PortalUrl]">[System:PortalUrl]</a></p>
  <p>Für deinen Account speichern wir deinen Namen und deine E-Mail-Adresse. Welche Daten wir zu welchem Zweck verarbeiten, wie lange wir sie speichern und welche Rechte du hast (z. B. Auskunft, Widerspruch und Löschung), steht in unserer <a href="[System:PrivacyPolicyLink]">Datenschutzerklärung</a>. Wenn du keinen Account möchtest, melde dich über die dort genannten Kontaktdaten, dann löschen wir ihn.</p>
  <p>Viele Grüße,<br>Dein EduHub Team</p>
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <!-- English -->
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>An account has been created for you on the EduHub platform, for example because you were listed as a speaker or organizer of an offering.</p>
  <p>To log in, please set a password:</p>
  <p><a href="[System:PasswordResetLink]">Set password</a></p>
  <p>If the link does not work, copy this URL into your browser:<br>[System:PasswordResetLink]</p>
  <p>Afterwards you can log in here: <a href="[System:PortalUrl]">[System:PortalUrl]</a></p>
  <p>For your account we store your name and email address. Our <a href="[System:PrivacyPolicyLink]">privacy policy</a> explains which data we process and why, how long we keep it and what your rights are (e.g. access, objection and erasure). If you do not want an account, contact us using the details given there and we will delete it.</p>
  <p>Best regards,<br>The EduHub Team</p>
</body>
</html>',
  "updated_at" = NOW()
WHERE "type" = 'USER_CREATED'
  AND "courseId" IS NULL
  AND "content" LIKE '%[User:Firstname]%'
  AND "content" LIKE '%Die Passwort-Setzung ist optional%';

-- 3. An edited USER_CREATED template keeps its text but must still carry the
--    privacy notice, so it is added before </body> (or at the end when the
--    editor stored no document wrapper). Skips templates that already link it,
--    which includes the one replaced above.
UPDATE "public"."MailTemplate"
SET
  "content" = CASE
    WHEN "content" LIKE '%</body>%' THEN replace("content", '</body>', notice.html || '</body>')
    ELSE "content" || notice.html
  END,
  "updated_at" = NOW()
FROM (SELECT '
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
  <p>Für deinen Account speichern wir deinen Namen und deine E-Mail-Adresse. Welche Daten wir zu welchem Zweck verarbeiten und welche Rechte du hast, steht in unserer <a href="[System:PrivacyPolicyLink]">Datenschutzerklärung</a>.</p>
  <p>For your account we store your name and email address. Our <a href="[System:PrivacyPolicyLink]">privacy policy</a> explains which data we process and why, and what your rights are.</p>
'::text AS html) AS notice
WHERE "type" = 'USER_CREATED'
  AND "courseId" IS NULL
  AND "content" NOT LIKE '%[System:PrivacyPolicyLink]%';
