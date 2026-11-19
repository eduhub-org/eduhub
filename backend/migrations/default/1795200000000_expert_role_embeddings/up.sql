-- Semantic expert search (ADR 0004): one embedding per Expert Role source (a course, session,
-- project or achievement option that has instructors, speakers or mentors).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "public"."ExpertRoleEmbedding" (
  "id"          serial      NOT NULL,
  "sourceType"  text        NOT NULL,
  "sourceId"    integer     NOT NULL,
  "model"       text        NOT NULL,
  "contentHash" text        NOT NULL,
  "embedding"   vector(768) NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "ExpertRoleEmbedding_source_unique" UNIQUE ("sourceType", "sourceId"),
  CONSTRAINT "ExpertRoleEmbedding_sourceType_check"
    CHECK ("sourceType" IN ('COURSE', 'SESSION', 'PROJECT', 'ACHIEVEMENT_OPTION'))
);

COMMENT ON TABLE "public"."ExpertRoleEmbedding" IS
  E'Embedding of the text of an Expert Role source (ADR 0004). contentHash is md5 of the source text in ExpertRoleSource; model names the embedding model, so a model change can be detected.';

CREATE TRIGGER "set_public_ExpertRoleEmbedding_updated_at"
BEFORE UPDATE ON "public"."ExpertRoleEmbedding"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- The texts to embed: every source that currently has an instructor, speaker or mentor. Notes are
-- never part of it. needsEmbedding marks sources without an embedding or whose text changed.
CREATE VIEW "public"."ExpertRoleSource" AS
WITH sources AS (
  SELECT 'COURSE'::text AS "sourceType", c."id" AS "sourceId",
         concat_ws(E'\n', c."title", c."tagline", c."headingDescriptionField1", c."contentDescriptionField1",
                   c."headingDescriptionField2", c."contentDescriptionField2") AS "text"
    FROM "public"."Course" c
   WHERE EXISTS (SELECT 1 FROM "public"."CourseInstructor" ci WHERE ci."courseId" = c."id")
  UNION ALL
  SELECT 'SESSION', s."id", concat_ws(E'\n', s."title", s."description", c."title")
    FROM "public"."Session" s
    JOIN "public"."Course" c ON c."id" = s."courseId"
   WHERE EXISTS (SELECT 1 FROM "public"."SessionSpeaker" ss WHERE ss."sessionId" = s."id")
  UNION ALL
  SELECT 'PROJECT', p."id", concat_ws(E'\n', p."title", p."tagline", p."description")
    FROM "public"."Project" p
   WHERE EXISTS (SELECT 1 FROM "public"."ProjectMentor" pm WHERE pm."projectId" = p."id")
  UNION ALL
  SELECT 'ACHIEVEMENT_OPTION', ao."id", concat_ws(E'\n', ao."title", ao."description")
    FROM "public"."AchievementOption" ao
   WHERE EXISTS (SELECT 1 FROM "public"."AchievementOptionMentor" aom WHERE aom."achievementOptionId" = ao."id")
)
SELECT s."sourceType", s."sourceId", s."text", md5(s."text") AS "contentHash",
       (e."id" IS NULL OR e."contentHash" <> md5(s."text")) AS "needsEmbedding"
  FROM sources s
  LEFT JOIN "public"."ExpertRoleEmbedding" e
    ON e."sourceType" = s."sourceType" AND e."sourceId" = s."sourceId";

-- Return type of match_expert_roles only; it never holds rows.
CREATE TABLE "public"."ExpertRoleMatch" (
  "sourceType" text             NOT NULL,
  "sourceId"   integer          NOT NULL,
  "similarity" double precision NOT NULL,
  PRIMARY KEY ("sourceType", "sourceId")
);

COMMENT ON TABLE "public"."ExpertRoleMatch" IS
  E'Return type of match_expert_roles (semantic expert search); always empty.';

-- The sources most similar to a query embedding (cosine similarity), for one model. The embedding
-- is passed as text ("[0.1, ...]") since GraphQL has no vector type.
CREATE OR REPLACE FUNCTION "public"."match_expert_roles"(
  query_embedding text,
  embedding_model text,
  min_similarity double precision,
  match_count integer
)
RETURNS SETOF "public"."ExpertRoleMatch"
LANGUAGE sql
STABLE
AS $$
  SELECT e."sourceType", e."sourceId", 1 - (e."embedding" <=> query_embedding::vector) AS "similarity"
    FROM "public"."ExpertRoleEmbedding" e
   WHERE e."model" = embedding_model
     AND 1 - (e."embedding" <=> query_embedding::vector) >= min_similarity
   ORDER BY e."embedding" <=> query_embedding::vector
   LIMIT match_count
$$;
