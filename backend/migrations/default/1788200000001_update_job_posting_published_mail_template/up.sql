-- The publish confirmation becomes the single transactional mail for a StuJo
-- posting: confirmation + payment receipt + invoice (the PDF is attached via
-- MailLog.attachments) + the reference to the terms.
--
-- The invoice section is wrapped in a [#if:Invoice] block so one template also
-- serves free (MINIJOB) and credit-funded postings, which have no invoice at
-- all. See applyConditionalBlocks in
-- frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts.
--
-- Uses <ul>/<li> rather than <table>: the admin editor sanitises content with
-- DOMPurify (EmailEditor.tsx) and would silently strip tables on save.
--
-- Only the default template (courseId IS NULL) is touched; per-course
-- overrides do not exist for job postings.

UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent to the employer contact when a job posting is published; carries the payment receipt, the invoice number and the invoice PDF as an attachment. Conditional blocks: [#if:Invoice] wraps the whole invoice section, [#if:InvoicePdf] the attachment sentence, [#if:InvoiceLink] the online link, [#if:InvoicePending] the fallback when neither exists yet, [#if:TermsAccepted] the consent date'
WHERE "value" = 'JOB_POSTING_PUBLISHED';

UPDATE "public"."MailTemplate"
SET "subject" = 'Dein Stellenangebot ist online: [JobPosting:Title]',
    "content" = '<p>Hallo,</p>
<p>Dein Stellenangebot <strong>[JobPosting:Title]</strong> ist seit dem [JobPosting:PublishedAt] veröffentlicht und bis zum <strong>[JobPosting:ExpiresAt]</strong> auf allen StuJo-Portalen sichtbar.</p>
<h3>Dein Angebot</h3>
<ul>
<li>Titel: <strong>[JobPosting:Title]</strong></li>
<li>Kategorie: [JobPosting:Type]</li>
<li>Unternehmen: [Organization:Name]</li>
<li>Online bis: [JobPosting:ExpiresAt]</li>
</ul>
<h3>Zahlung</h3>
<p>[JobPosting:Payment]</p>
[#if:Invoice]<h3>Deine Rechnung</h3>
<ul>
<li>Rechnungsnummer: <strong>[Invoice:Number]</strong></li>
<li>Rechnungsdatum: [Invoice:Date]</li>
<li>Nettobetrag: [Invoice:NetTotal]</li>
<li>zzgl. [Invoice:VatRate] % MwSt.: [Invoice:VatTotal]</li>
<li>Gesamtbetrag: <strong>[Invoice:GrossTotal]</strong></li>
<li>Status: [Invoice:PaymentStatus]</li>
</ul>
[#if:InvoicePdf]<p>Die Rechnung liegt dieser E-Mail als PDF bei.</p>
[/if:InvoicePdf][#if:InvoiceLink]<p>Du kannst sie jederzeit online abrufen: <a href="[Invoice:HostedUrl]">Rechnung ansehen</a></p>
[/if:InvoiceLink][#if:InvoicePending]<p>Das Rechnungsdokument stellen wir Dir in Kürze separat zu.</p>
[/if:InvoicePending][/if:Invoice]<p>Dein Angebot bearbeiten oder archivieren kannst Du jederzeit unter <a href="[JobPosting:DashboardUrl]">Mein StuJo</a>.</p>
<p>Viel Erfolg bei der Suche!<br>Dein StuJo-Team</p>
<hr>
<p><span style="font-size:0.85em;color:#666;">Es gelten unsere <a href="[Legal:TermsUrl]">Allgemeinen Geschäftsbedingungen</a>[#if:TermsAccepted], denen Du am [JobPosting:TermsAcceptedAt] bei der Veröffentlichung zugestimmt hast[/if:TermsAccepted].</span></p>'
WHERE "type" = 'JOB_POSTING_PUBLISHED' AND "courseId" IS NULL;
