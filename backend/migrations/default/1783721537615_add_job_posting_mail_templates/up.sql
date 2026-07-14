-- Mail template types and default templates for the StuJo job board
-- (phase 4 of docs/STUJO_INTEGRATION_PLAN.md).
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('JOB_POSTING_PUBLISHED', 'Sent to the employer contact when a job posting is published'),
  ('JOB_POSTING_EXPIRED', 'Sent to the employer contact when a job posting expires (with re-post link)'),
  ('JOB_POSTING_ADMIN_NOTICE', 'Sent to the platform admins when a job posting is published (post-hoc moderation)'),
  ('JOB_POSTING_PAYMENT_FAILED', 'Sent to the employer contact when an async payment (SEPA/bank transfer) fails');

-- Default templates (courseId NULL marks defaults, per
-- 1763677164352_change_mailtemplate_courseid_to_null_and_add_fk). Placeholders use the [Category:Name] syntax from
-- functions/callNodeFunction/emailTemplateVariables.js.
INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from") VALUES
  (
    'JOB_POSTING_PUBLISHED', NULL,
    'Dein Stellenangebot ist online: [JobPosting:Title]',
    '<p>Hallo,</p><p>Dein Stellenangebot <b>[JobPosting:Title]</b> ist jetzt veröffentlicht und bis zum <b>[JobPosting:ExpiresAt]</b> auf allen StuJo-Portalen sichtbar.</p><p>Du kannst Dein Angebot jederzeit unter <a href="[JobPosting:DashboardUrl]">Mein StuJo</a> bearbeiten oder archivieren.</p><p>Viel Erfolg bei der Suche!<br>Dein StuJo-Team</p>',
    'noreply@stujo.net'
  ),
  (
    'JOB_POSTING_EXPIRED', NULL,
    'Dein Stellenangebot ist abgelaufen: [JobPosting:Title]',
    '<p>Hallo,</p><p>Dein Stellenangebot <b>[JobPosting:Title]</b> war 8 Wochen auf StuJo sichtbar und ist heute abgelaufen.</p><p>Du suchst weiterhin? Mit einem Klick kannst Du das Angebot erneut veröffentlichen: <a href="[JobPosting:RepostUrl]">Jetzt erneut inserieren</a>.</p><p>Dein StuJo-Team</p>',
    'noreply@stujo.net'
  ),
  (
    'JOB_POSTING_ADMIN_NOTICE', NULL,
    'Neues Stellenangebot veröffentlicht: [JobPosting:Title]',
    '<p>Neues Angebot auf StuJo:</p><p><b>[JobPosting:Title]</b><br>Arbeitgeber: [Organization:Name]<br>Typ: [JobPosting:Type]<br>Zahlung: [JobPosting:Payment]</p><p><a href="[JobPosting:AdminUrl]">In der Verwaltung prüfen</a></p>',
    'noreply@stujo.net'
  ),
  (
    'JOB_POSTING_PAYMENT_FAILED', NULL,
    'Zahlung fehlgeschlagen für Dein Stellenangebot: [JobPosting:Title]',
    '<p>Hallo,</p><p>die Zahlung für Dein Stellenangebot <b>[JobPosting:Title]</b> konnte nicht abgeschlossen werden. Das Angebot wurde deshalb wieder offline genommen.</p><p>Du kannst die Veröffentlichung jederzeit erneut starten: <a href="[JobPosting:RepostUrl]">Zur Zahlung</a>.</p><p>Dein StuJo-Team</p>',
    'noreply@stujo.net'
  );
