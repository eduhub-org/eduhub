DROP FUNCTION IF EXISTS "public"."user_expert_last_active_at"("public"."User");
DROP TABLE IF EXISTS "public"."ExpertNote";
ALTER TABLE "public"."User" DROP COLUMN IF EXISTS "doNotContact";
