-- The Assistant's spending per calendar month (Europe/Berlin), for the monthly spending cap
-- (issue #2193). Anonymous totals only: no user ids, no content.
CREATE TABLE "public"."AssistantMonthlyUsage" (
  "id"           serial         NOT NULL,
  "month"        text           NOT NULL,
  "requestCount" integer        NOT NULL DEFAULT 0,
  "inputTokens"  bigint         NOT NULL DEFAULT 0,
  "outputTokens" bigint         NOT NULL DEFAULT 0,
  "costEur"      numeric(12, 6) NOT NULL DEFAULT 0,
  "created_at"   timestamptz    NOT NULL DEFAULT now(),
  "updated_at"   timestamptz    NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "AssistantMonthlyUsage_month_unique" UNIQUE ("month"),
  CONSTRAINT "AssistantMonthlyUsage_month_format" CHECK ("month" ~ '^\d{4}-\d{2}$')
);
COMMENT ON TABLE "public"."AssistantMonthlyUsage" IS E'Anonymous monthly token and cost totals of the Assistant, for its spending cap.';
CREATE TRIGGER "set_public_AssistantMonthlyUsage_updated_at"
BEFORE UPDATE ON "public"."AssistantMonthlyUsage"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
