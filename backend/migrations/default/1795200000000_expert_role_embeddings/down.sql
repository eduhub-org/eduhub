DROP FUNCTION IF EXISTS "public"."match_expert_roles"(text, text, double precision, integer, integer[]);
DROP TABLE IF EXISTS "public"."ExpertRoleMatch";
DROP VIEW IF EXISTS "public"."ExpertRoleSource";
DROP TABLE IF EXISTS "public"."ExpertRoleEmbedding";
-- The vector extension stays: dropping it would fail if anything else starts using it.
