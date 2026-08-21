ALTER TABLE "public"."MailLog" ADD COLUMN "metadata" jsonb NULL;

COMMENT ON COLUMN "public"."MailLog"."metadata" IS E'Structured context about why this mail was queued, e.g. {"type": "INVITATION_EXPIRING_SOON", "enrollmentId": 42}. The reminder cron jobs match on it to avoid sending the same mail to the same recipient twice.';

-- Supports the containment lookups (metadata @> {...}) the cron jobs use for deduplication
CREATE INDEX "MailLog_metadata_idx" ON "public"."MailLog" USING gin ("metadata");
