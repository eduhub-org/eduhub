ALTER TABLE "public"."Session"
ADD COLUMN "isPublicEvent" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Session"."isPublicEvent" IS 'When true, the session is exposed as a standalone public event page and can appear in public event listings.';
