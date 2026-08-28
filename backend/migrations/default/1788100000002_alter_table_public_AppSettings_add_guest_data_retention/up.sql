-- GDPR Art. 5(1)(e) (storage limitation) requires a defined retention period for
-- guest personal data. Kept configurable so it can be adjusted (for example to
-- match a funding programme's evidence-retention period) without a code change.
ALTER TABLE "public"."AppSettings"
  ADD COLUMN "guestDataRetentionMonths" integer NOT NULL DEFAULT 12;

ALTER TABLE "public"."AppSettings"
  ADD CONSTRAINT "AppSettings_guestDataRetentionMonths_check"
  CHECK ("guestDataRetentionMonths" > 0);

COMMENT ON COLUMN "public"."AppSettings"."guestDataRetentionMonths" IS E'Months after an event ends before a guest registrant''s personal data is anonymized automatically by the anonymize_guest_data cron job.';
