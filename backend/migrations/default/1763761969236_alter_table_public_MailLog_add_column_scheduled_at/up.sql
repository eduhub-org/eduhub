ALTER TABLE "public"."MailLog" ADD COLUMN "scheduledAt" timestamptz NULL;
COMMENT ON COLUMN "public"."MailLog"."scheduledAt" IS 'Timestamp when the email should be sent. If NULL, email is sent immediately. If set to a future time, email sending is delayed until that time.';

-- Add index for efficient querying of scheduled emails
CREATE INDEX "MailLog_scheduledAt_idx" ON "public"."MailLog" ("scheduledAt") WHERE "scheduledAt" IS NOT NULL;

