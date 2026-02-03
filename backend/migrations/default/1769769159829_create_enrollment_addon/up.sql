-- Create EnrollmentAddon junction table to track which add-ons were booked for each enrollment
CREATE TABLE "public"."EnrollmentAddon" (
  "id" serial PRIMARY KEY,
  "enrollmentId" integer NOT NULL REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE,
  "addonMappingId" integer NOT NULL REFERENCES "CourseAddonMapping"("id") ON DELETE RESTRICT,
  "priceAtPurchase" integer NOT NULL,  -- Price in cents at time of purchase
  "currency" text NOT NULL DEFAULT 'EUR',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Ensure one enrollment can only have one instance of each add-on
CREATE UNIQUE INDEX "EnrollmentAddon_enrollmentId_addonMappingId_key" ON "public"."EnrollmentAddon" ("enrollmentId", "addonMappingId");

-- Add indexes on foreign keys for optimized lookups
CREATE INDEX "EnrollmentAddon_enrollmentId_idx" ON "public"."EnrollmentAddon" ("enrollmentId");
CREATE INDEX "EnrollmentAddon_addonMappingId_idx" ON "public"."EnrollmentAddon" ("addonMappingId");

-- Add comment
COMMENT ON TABLE "public"."EnrollmentAddon" IS 'Tracks which add-ons were selected and purchased for each course enrollment';
