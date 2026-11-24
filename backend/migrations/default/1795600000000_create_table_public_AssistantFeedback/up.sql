-- Conversations rated 👎 in the Assistant (issue #2193, ADR 0005), kept with the user's consent
-- for 30 days and then deleted by the delete_expired_assistant_feedback cron trigger.
-- Deliberately no userId: only the conversation itself is kept, not who had it.
CREATE TABLE "public"."AssistantFeedback" (
  "id"           serial      NOT NULL,
  "conversation" jsonb       NOT NULL,
  "comment"      text,
  "route"        text,
  "model"        text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."AssistantFeedback" IS E'Assistant conversations rated thumbs-down, stored with consent and without user id; deleted after 30 days.';
CREATE INDEX "AssistantFeedback_created_at_idx" ON "public"."AssistantFeedback" ("created_at");
