-- Knowledge index of the Assistant (issue #2195, ADR 0005): passages from the organization's rules,
-- the platform manual, the glossary (CONTEXT.md), the locale files and the live release's source
-- code, with one embedding each. Built from a checkout of the released tag; never from database
-- content. Separate from the Expert Role embeddings (ADR 0004).

CREATE EXTENSION IF NOT EXISTS vector;

-- One finished build of the index. A row is only written once all of a run's chunks are stored, in
-- the same transaction that removes the previous run, so a failed build keeps the previous index.
CREATE TABLE "public"."KnowledgeIndex" (
  "id"          text        NOT NULL,
  "release"     text        NOT NULL,
  "model"       text        NOT NULL,
  "chunkCount"  integer     NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "public"."KnowledgeIndex" IS
  E'A finished build of the Assistant''s knowledge index (issue #2195). id is the run id its KnowledgeChunk rows carry; release the git tag it was built from.';

CREATE TRIGGER "set_public_KnowledgeIndex_updated_at"
BEFORE UPDATE ON "public"."KnowledgeIndex"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

CREATE TABLE "public"."KnowledgeChunk" (
  "id"             serial      NOT NULL,
  "indexRunId"     text        NOT NULL,
  "sourceType"     text        NOT NULL,
  -- Only for ORGANIZATION_RULES: the organization whose rules these are.
  "organizationId" integer,
  "language"       text,
  "title"          text        NOT NULL,
  "path"           text        NOT NULL,
  "url"            text        NOT NULL,
  "content"        text        NOT NULL,
  "contentHash"    text        NOT NULL,
  "model"          text        NOT NULL,
  "embedding"      vector(768) NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "KnowledgeChunk_sourceType_check"
    CHECK ("sourceType" IN ('ORGANIZATION_RULES', 'MANUAL', 'GLOSSARY', 'LOCALE', 'CODE')),
  CONSTRAINT "KnowledgeChunk_language_check" CHECK ("language" IS NULL OR "language" IN ('de', 'en'))
);

COMMENT ON TABLE "public"."KnowledgeChunk" IS
  E'A passage of the Assistant''s knowledge index (issue #2195) with its embedding. Only rows of a run listed in KnowledgeIndex are searched. contentHash is md5 of the embedded text, so unchanged passages reuse their embedding in the next build.';

CREATE INDEX "KnowledgeChunk_indexRunId" ON "public"."KnowledgeChunk" ("indexRunId");
CREATE INDEX "KnowledgeChunk_model_contentHash" ON "public"."KnowledgeChunk" ("model", "contentHash");

CREATE TRIGGER "set_public_KnowledgeChunk_updated_at"
BEFORE UPDATE ON "public"."KnowledgeChunk"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Return type of match_knowledge only; it never holds rows.
CREATE TABLE "public"."KnowledgeMatch" (
  "id"             integer          NOT NULL,
  "sourceType"     text             NOT NULL,
  "organizationId" integer,
  "language"       text,
  "title"          text             NOT NULL,
  "path"           text             NOT NULL,
  "url"            text             NOT NULL,
  "content"        text             NOT NULL,
  "similarity"     double precision NOT NULL,
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "public"."KnowledgeMatch" IS
  E'Return type of match_knowledge (the Assistant''s knowledge search); always empty.';

-- The passages of the active index most similar to a query embedding (cosine similarity), for one
-- model. The embedding is passed as text ("[0.1, ...]") since GraphQL has no vector type.
-- Organization rules are only returned for organization_ids (the asker's organizations and the
-- course's), before the limit applies.
CREATE OR REPLACE FUNCTION "public"."match_knowledge"(
  query_embedding text,
  embedding_model text,
  min_similarity double precision,
  match_count integer,
  organization_ids integer[] DEFAULT '{}'
)
RETURNS SETOF "public"."KnowledgeMatch"
LANGUAGE sql
STABLE
AS $$
  SELECT c."id", c."sourceType", c."organizationId", c."language", c."title", c."path", c."url",
         c."content", 1 - (c."embedding" <=> query_embedding::vector) AS "similarity"
    FROM "public"."KnowledgeChunk" c
    JOIN "public"."KnowledgeIndex" i ON i."id" = c."indexRunId"
   WHERE c."model" = embedding_model
     AND 1 - (c."embedding" <=> query_embedding::vector) >= min_similarity
     AND (c."organizationId" IS NULL OR c."organizationId" = ANY (COALESCE(organization_ids, '{}')))
   ORDER BY c."embedding" <=> query_embedding::vector
   LIMIT match_count
$$;
