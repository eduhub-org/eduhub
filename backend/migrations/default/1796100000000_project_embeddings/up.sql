-- Semantic project search (ADR 0009): one embedding per project, from its title, tagline and
-- description. Separate from ExpertRoleEmbedding on purpose: that table only holds projects with
-- mentors, as Expert Role sources, so a mentored project is embedded in both.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "public"."ProjectEmbedding" (
  "id"          serial      NOT NULL,
  "projectId"   integer     NOT NULL,
  "model"       text        NOT NULL,
  "contentHash" text        NOT NULL,
  "embedding"   vector(768) NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "ProjectEmbedding_projectId_unique" UNIQUE ("projectId"),
  CONSTRAINT "ProjectEmbedding_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON UPDATE RESTRICT ON DELETE CASCADE
);

COMMENT ON TABLE "public"."ProjectEmbedding" IS
  E'Embedding of a project''s title, tagline and description (ADR 0009). contentHash is md5 of the text in ProjectEmbeddingSource; model names the embedding model, so a model change can be detected.';

CREATE TRIGGER "set_public_ProjectEmbedding_updated_at"
BEFORE UPDATE ON "public"."ProjectEmbedding"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- The text to embed of every project. needsEmbedding marks projects without an embedding or whose
-- text changed.
CREATE VIEW "public"."ProjectEmbeddingSource" AS
WITH sources AS (
  SELECT p."id" AS "projectId", concat_ws(E'\n', p."title", p."tagline", p."description") AS "text"
    FROM "public"."Project" p
)
SELECT s."projectId", s."text", md5(s."text") AS "contentHash",
       (e."id" IS NULL OR e."contentHash" <> md5(s."text")) AS "needsEmbedding"
  FROM sources s
  LEFT JOIN "public"."ProjectEmbedding" e ON e."projectId" = s."projectId";

-- Return type of match_projects only; it never holds rows.
CREATE TABLE "public"."ProjectMatch" (
  "projectId"  integer          NOT NULL,
  "similarity" double precision NOT NULL,
  PRIMARY KEY ("projectId")
);

COMMENT ON TABLE "public"."ProjectMatch" IS
  E'Return type of match_projects (semantic project search); always empty.';

-- The projects most similar to a query embedding (cosine similarity), for one model. The embedding
-- is passed as text ("[0.1, ...]") since GraphQL has no vector type. organization_ids (null for
-- admins) keeps only projects listed in a course of a program of those organizations, before the
-- limit applies, so an org admin's best matches are not crowded out by other organizations'
-- projects. Every project is listed in a course, so there is no other path to an organization.
CREATE OR REPLACE FUNCTION "public"."match_projects"(
  query_embedding text,
  embedding_model text,
  min_similarity double precision,
  match_count integer,
  organization_ids integer[] DEFAULT NULL
)
RETURNS SETOF "public"."ProjectMatch"
LANGUAGE sql
STABLE
AS $$
  SELECT e."projectId", 1 - (e."embedding" <=> query_embedding::vector) AS "similarity"
    FROM "public"."ProjectEmbedding" e
   WHERE e."model" = embedding_model
     AND 1 - (e."embedding" <=> query_embedding::vector) >= min_similarity
     AND (
       organization_ids IS NULL
       OR EXISTS (
            SELECT 1 FROM "public"."ProjectCourse" pc
              JOIN "public"."Course" c ON c."id" = pc."courseId"
              JOIN "public"."Program" p ON p."id" = c."programId"
             WHERE pc."projectId" = e."projectId" AND p."organizationId" = ANY (organization_ids))
     )
   ORDER BY e."embedding" <=> query_embedding::vector
   LIMIT match_count
$$;
