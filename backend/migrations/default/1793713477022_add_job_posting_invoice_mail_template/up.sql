-- Follow-up mail with the invoice PDF for a job posting paid by direct debit.
--
-- Stripe raises a Checkout invoice only once the money is collected, which for
-- a SEPA Lastschrift is days after checkout. The confirmation
-- (JOB_POSTING_PUBLISHED) goes out at checkout without the PDF; this mail
-- delivers it once the invoice exists. It also covers a card payment whose
-- invoice Stripe raised only after the confirmation went out. Queued by deliverJobPostingInvoice in
-- frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts.
--
-- Uses <ul>/<li> rather than <table>: the admin editor sanitises content with
-- DOMPurify (EmailEditor.tsx) and would silently strip tables on save.

INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES
  ('JOB_POSTING_INVOICE', 'Sent to the employer contact with the invoice PDF attached when the invoice is raised after the confirmation went out (direct debit: once the money is collected). Conditional blocks: [#if:InvoiceLink] the online link');

INSERT INTO "public"."MailTemplate" ("type", "courseId", "subject", "content", "from") VALUES
  (
    'JOB_POSTING_INVOICE', NULL,
    'Deine Rechnung für Dein Stellenangebot: [JobPosting:Title]',
    '<p>Hallo,</p>
<p>anbei erhältst Du die Rechnung für Dein Stellenangebot <strong>[JobPosting:Title]</strong> als PDF.</p>
<h3>Deine Rechnung</h3>
<ul>
<li>Rechnungsnummer: <strong>[Invoice:Number]</strong></li>
<li>Rechnungsdatum: [Invoice:Date]</li>
<li>Nettobetrag: [Invoice:NetTotal]</li>
<li>zzgl. [Invoice:VatRate] % MwSt.: [Invoice:VatTotal]</li>
<li>Gesamtbetrag: <strong>[Invoice:GrossTotal]</strong></li>
<li>Status: [Invoice:PaymentStatus]</li>
</ul>
[#if:InvoiceLink]<p>Du kannst sie jederzeit online abrufen: <a href="[Invoice:HostedUrl]">Rechnung ansehen</a></p>
[/if:InvoiceLink]<p>Dein StuJo-Team</p>',
    'noreply@stujo.net'
  );
