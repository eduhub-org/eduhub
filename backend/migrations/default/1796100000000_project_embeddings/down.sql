DROP FUNCTION IF EXISTS "public"."match_projects"(text, text, double precision, integer, integer[]);
DROP TABLE IF EXISTS "public"."ProjectMatch";
DROP VIEW IF EXISTS "public"."ProjectEmbeddingSource";
DROP TABLE IF EXISTS "public"."ProjectEmbedding";
-- The vector extension stays: ExpertRoleEmbedding uses it too.
