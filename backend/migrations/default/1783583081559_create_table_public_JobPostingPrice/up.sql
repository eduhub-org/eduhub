-- Price per posting type. Prices are global (no portal dimension), matching
-- the Rails model. stripePriceId is filled in when the Stripe products are
-- created (phase 4).
CREATE TABLE "public"."JobPostingPrice" (
  "id"             serial      NOT NULL,
  "jobPostingType" text        NOT NULL,
  "price"          integer     NOT NULL,
  "currency"       text        NOT NULL DEFAULT 'EUR',
  "vatRate"        numeric(5,2) NOT NULL DEFAULT 19.00,
  "durationDays"   integer     NOT NULL DEFAULT 56,
  "stripePriceId"  text        NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("jobPostingType")
);

COMMENT ON TABLE "public"."JobPostingPrice" IS E'Net price (cents) and publication window per job posting type.';
COMMENT ON COLUMN "public"."JobPostingPrice"."price" IS 'Net amount in smallest currency unit (cents)';
COMMENT ON COLUMN "public"."JobPostingPrice"."durationDays" IS 'Publication window in days (StuJo: 8 weeks)';

ALTER TABLE "public"."JobPostingPrice"
  ADD CONSTRAINT "JobPostingPrice_jobPostingType_fkey"
  FOREIGN KEY ("jobPostingType") REFERENCES "public"."JobPostingType"("value")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE TRIGGER "set_public_JobPostingPrice_updated_at"
BEFORE UPDATE ON "public"."JobPostingPrice"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Net prices from the Rails Invoice#calculatePrice: Festanstellungen 100 EUR,
-- other paid types 50 EUR, Minijobs free.
INSERT INTO "public"."JobPostingPrice" ("jobPostingType", "price") VALUES
  ('MINIJOB', 0),
  ('WORKING_STUDENT', 5000),
  ('INTERNSHIP', 5000),
  ('THESIS', 5000),
  ('PERMANENT', 10000),
  ('TRAINEE', 5000),
  ('STATE_RECOGNITION_INTERNSHIP', 5000);
