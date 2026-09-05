-- Mail templates for the StuJo self-service organization claim.
--
-- JOB_ORGANIZATION_CLAIMED goes to the address responsible for StuJo enquiries
-- (JobPortal.contactEmail, falling back to STUJO_ADMIN_EMAIL). The claim itself
-- is instant, so this mail plus the claimVerification flag are how opencampus
-- notices a claim that needs checking.
--
-- JOB_ORGANIZATION_ACCESS_REQUEST goes to the employees who already administer
-- the organization's job offers, when a colleague of theirs tries to claim it.
-- It never reveals their address to the requester - the mail travels the other
-- way round.
--
-- German only and from noreply@stujo.net, matching the other job-board templates
-- (1783721537615_add_job_posting_mail_templates). No <table> markup: the admin
-- editor's DOMPurify configuration strips it. No [#if:] conditional blocks
-- either - these mails are queued through lib/queueEmail.js, which does not
-- resolve them.

-- 1. Register the new MailTemplateType enum values (before the templates: MailTemplate.type has an FK)
INSERT INTO "public"."MailTemplateType" ("value", "comment")
VALUES
  ('JOB_ORGANIZATION_CLAIMED', 'Sent to the StuJo contact address when someone claims job-offer management for an organization that had no job admin'),
  ('JOB_ORGANIZATION_ACCESS_REQUEST', 'Sent to an organization''s existing job admins when someone else asks for access to its job offers')
ON CONFLICT ("value") DO NOTHING;

-- 2. Seed default templates (courseId NULL marks the default; idempotent per type)

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'JOB_ORGANIZATION_CLAIMED', NULL,
  'Neuer Stellen-Zugang: [Organization:Name]',
  '<p>Hallo,</p>
<p><strong>[OrganizationClaim:UserName]</strong> ([OrganizationClaim:UserEmail]) verwaltet ab jetzt die Stellenanzeigen von <strong>[Organization:Name]</strong>.</p>
<ul>
  <li>Pr&uuml;fung: [OrganizationClaim:Verification]</li>
  <li>Berechtigung: nur Stellenanzeigen (keine Organisations-Einstellungen)</li>
</ul>
<p>Die Person hat best&auml;tigt, im Namen dieser Organisation Stellenanzeigen ver&ouml;ffentlichen zu d&uuml;rfen. Der Zugang wurde sofort eingerichtet, damit sie direkt inserieren kann.</p>
<p><a href="[OrganizationClaim:AdminUrl]">Zugang in der Verwaltung ansehen oder entziehen</a></p>
<p>Dein StuJo-Team</p>',
  'noreply@stujo.net', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MailTemplate"
  WHERE "type" = 'JOB_ORGANIZATION_CLAIMED' AND "courseId" IS NULL
);

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from", "created_at", "updated_at")
SELECT
  'JOB_ORGANIZATION_ACCESS_REQUEST', NULL,
  'Zugang zu den Stellenanzeigen von [Organization:Name] angefragt',
  '<p>Hallo,</p>
<p><strong>[OrganizationClaim:UserName]</strong> ([OrganizationClaim:UserEmail]) m&ouml;chte die Stellenanzeigen von <strong>[Organization:Name]</strong> verwalten. Du verwaltest sie bisher.</p>
<p>Wenn das passt, antworte einfach auf diese E-Mail oder wende Dich an [OrganizationClaim:ContactEmail] &ndash; wir richten den Zugang dann ein.</p>
<p>Wenn Du die Person nicht kennst, ignoriere diese E-Mail bitte. Es wurde nichts ge&auml;ndert und Deine Adresse haben wir nicht weitergegeben.</p>
<p>Dein StuJo-Team</p>',
  'noreply@stujo.net', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MailTemplate"
  WHERE "type" = 'JOB_ORGANIZATION_ACCESS_REQUEST' AND "courseId" IS NULL
);
