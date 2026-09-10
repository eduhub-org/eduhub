-- The job posting confirmation can be queued from three places: the Stripe
-- checkout webhook, the invoice.finalized webhook and the sweep. Each checks
-- MailLog before inserting, but that is a read followed by a write: two
-- deliveries arriving together can both pass the check and the employer gets
-- the same mail twice, attachment and all.
--
-- Let the database decide instead. Partial, so it constrains only rows that
-- carry a job posting dedup key and leaves every other mail alone.

CREATE UNIQUE INDEX "MailLog_job_posting_mail_unique"
  ON "public"."MailLog" ((metadata ->> 'type'), (metadata ->> 'jobPostingId'))
  WHERE metadata ? 'jobPostingId';
