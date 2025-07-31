-- Create FAQ collections table
CREATE TABLE "public"."FaqCollection" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("name")
);

-- Add comment to the table
COMMENT ON TABLE "public"."FaqCollection" IS E'Collections to group FAQ entries (e.g., default, for-teachers, for-admins)';

-- Insert default collection
INSERT INTO "public"."FaqCollection"("name") VALUES ('default');