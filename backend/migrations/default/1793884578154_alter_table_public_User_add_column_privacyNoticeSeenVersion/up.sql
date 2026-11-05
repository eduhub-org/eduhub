-- Privacy policy versioning (docs/LEGAL_DOCUMENTS.md, "Changing the privacy
-- policy"). The policy is information, not a contract: nobody has to accept a
-- new version, but account holders are told once about material changes.
--
-- privacyNoticeSeenVersion is the PRIVACY_POLICY_VERSION
-- (frontend-nx/apps/edu-hub/components/legal/privacyPolicyVersion.ts) whose
-- "policy updated" notice the user dismissed. NULL means they never saw one.
ALTER TABLE "public"."User" ADD COLUMN "privacyNoticeSeenVersion" text NULL;
COMMENT ON COLUMN "public"."User"."privacyNoticeSeenVersion" IS
  E'Privacy policy version (YYYY-MM-DD) whose update notice the user dismissed; NULL if none.';

-- The one-off mail for material changes, queued by
-- functions/callNodeFunction/scripts/send-privacy-policy-update.js.
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('PRIVACY_POLICY_UPDATED', 'Sent once to every active account when the privacy policy changes materially (new purposes, recipients or legal bases). Queued by scripts/send-privacy-policy-update.js; links to the change history at the end of the policy');

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from") VALUES
  (
    'PRIVACY_POLICY_UPDATED', NULL,
    'Wir haben unsere Datenschutzerklärung aktualisiert',
    '<p>Hallo [User:FirstName],</p>
<p>wir haben die Datenschutzerklärung von EduHub aktualisiert. Was sich geändert hat, steht kurz zusammengefasst am Ende der Datenschutzerklärung: <a href="[System:PrivacyPolicyLink]#aenderungen">Änderungen ansehen</a>.</p>
<p>Du musst nichts tun: Die Datenschutzerklärung informiert dich darüber, wie wir deine Daten verarbeiten.</p>
<p>Bei Fragen erreichst du uns jederzeit über die im Impressum genannte Adresse.</p>
<p>Dein EduHub-Team</p>',
    'noreply@opencampus.sh'
  );
