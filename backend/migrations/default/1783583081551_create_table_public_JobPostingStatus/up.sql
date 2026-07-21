-- Job posting lifecycle states.
CREATE TABLE "public"."JobPostingStatus" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."JobPostingStatus" IS 'Job posting lifecycle status values';

INSERT INTO "public"."JobPostingStatus" ("value", "comment") VALUES
  ('DRAFT', 'Being edited by the employer, not visible'),
  ('PENDING_PAYMENT', 'Awaiting Stripe checkout completion'),
  ('PUBLISHED', 'Publicly visible until expiresAt'),
  ('EXPIRED', 'Publication window elapsed (set by the expire_job_postings cron)'),
  ('ARCHIVED', 'Manually archived by the employer or admin');
