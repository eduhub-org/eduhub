-- Add organizationId column, defaulting all existing programs to the default org (id = 0)
ALTER TABLE "public"."Program"
ADD COLUMN "organizationId" integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN "public"."Program"."organizationId" IS 'Organization that owns the program. References Organization.id (0 = platform default)';

-- Add FK constraint
ALTER TABLE "public"."Program"
ADD CONSTRAINT "Program_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "public"."Organization" ("id")
ON UPDATE RESTRICT ON DELETE RESTRICT;
