ALTER TABLE "public"."Program"
ADD COLUMN IF NOT EXISTS "defaultProjectType" text;

COMMENT ON COLUMN "public"."Program"."defaultProjectType" IS
'Default Project.type value applied to projects that originate in courses of this program. Students never pick the type; it is finalized by the instructor at the PROPOSED to ONGOING transition.';
