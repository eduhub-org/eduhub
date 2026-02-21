-- Add general-purpose address fields to User (for billing, certificates, correspondence)
-- User already has zipCode and country (FK to Country)
ALTER TABLE "public"."User"
ADD COLUMN "addressLine1" text NULL,
ADD COLUMN "addressLine2" text NULL,
ADD COLUMN "city" text NULL;

COMMENT ON COLUMN "public"."User"."addressLine1" IS 'Street and house number. Used for billing, certificates, and correspondence';
COMMENT ON COLUMN "public"."User"."addressLine2" IS 'Additional address line (c/o, building, apartment). Used for billing, certificates, and correspondence';
COMMENT ON COLUMN "public"."User"."city" IS 'City. Used for billing, certificates, and correspondence';
