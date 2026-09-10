UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent to the employer contact when a job posting is published'
WHERE "value" = 'JOB_POSTING_PUBLISHED';

UPDATE "public"."MailTemplate"
SET "subject" = 'Dein Stellenangebot ist online: [JobPosting:Title]',
    "content" = '<p>Hallo,</p><p>Dein Stellenangebot <b>[JobPosting:Title]</b> ist jetzt veröffentlicht und bis zum <b>[JobPosting:ExpiresAt]</b> auf allen StuJo-Portalen sichtbar.</p><p>Du kannst Dein Angebot jederzeit unter <a href="[JobPosting:DashboardUrl]">Mein StuJo</a> bearbeiten oder archivieren.</p><p>Viel Erfolg bei der Suche!<br>Dein StuJo-Team</p>'
WHERE "type" = 'JOB_POSTING_PUBLISHED' AND "courseId" IS NULL;
