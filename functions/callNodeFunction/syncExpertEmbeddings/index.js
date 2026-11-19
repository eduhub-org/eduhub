import { GraphQLClient } from "graphql-request";
import { embedText, embeddingConfig, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * Keeps the Expert Role embeddings (ADR 0004) in step with the course, session, project and
 * achievement-option texts. Run nightly by a Hasura cron trigger: it drops vectors of another model
 * or of sources that no longer have instructors, speakers or mentors, then embeds new or changed
 * sources batch by batch until none are left or the time budget is used up. A first run on an
 * existing database backfills as much as fits; the following nights finish the rest.
 */

const BATCH_SIZE = 100;
const CONCURRENCY = 4;
// Below the cron trigger's 170 s timeout and callNodeFunction's 180 s, with room for the last batch.
const TIME_BUDGET_MS = 120_000;

const DELETE_STALE = `
  mutation DeleteStaleExpertRoleEmbeddings($model: String!) {
    delete_ExpertRoleEmbedding(where: { _or: [{ model: { _neq: $model } }, { _not: { Source: {} } }] }) {
      affected_rows
    }
  }
`;

const SOURCES_TO_EMBED = `
  query ExpertRoleSourcesToEmbed($limit: Int!) {
    ExpertRoleSource(where: { needsEmbedding: { _eq: true } }, limit: $limit) {
      sourceType
      sourceId
      text
      contentHash
    }
    ExpertRoleSource_aggregate(where: { needsEmbedding: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`;

const UPSERT_EMBEDDING = `
  mutation UpsertExpertRoleEmbedding($object: ExpertRoleEmbedding_insert_input!) {
    insert_ExpertRoleEmbedding_one(
      object: $object
      on_conflict: {
        constraint: ExpertRoleEmbedding_source_unique
        update_columns: [model, contentHash, embedding]
      }
    ) {
      id
    }
  }
`;

const client = () =>
  new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET },
  });

export default async function syncExpertEmbeddings(
  req,
  logger,
  { gql = client(), env = process.env, fetchImpl, now = Date.now, timeBudgetMs = TIME_BUDGET_MS } = {}
) {
  const config = embeddingConfig(env);
  if (!config) return { success: true, skipped: "EMBEDDING_PROVIDER is not set" };

  const startedAt = now();
  const deleted = (await gql.request(DELETE_STALE, { model: config.modelKey })).delete_ExpertRoleEmbedding
    .affected_rows;

  let embedded = 0;
  let remaining = 0;
  // Sources that failed in this run still need embedding; skipping them keeps them from blocking
  // the others. They are retried the next night.
  const failedKeys = new Set();
  const keyOf = (source) => `${source.sourceType}:${source.sourceId}`;

  const embedSource = async (source) => {
    try {
      const values = await embedText(config, source.text, "RETRIEVAL_DOCUMENT", { fetchImpl });
      await gql.request(UPSERT_EMBEDDING, {
        object: {
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          model: config.modelKey,
          contentHash: source.contentHash,
          embedding: toVectorLiteral(values),
        },
      });
      embedded += 1;
      remaining -= 1;
    } catch (error) {
      failedKeys.add(keyOf(source));
      logger.warn(`Could not embed ${source.sourceType} ${source.sourceId}`, { error: error.message });
    }
  };

  while (now() - startedAt < timeBudgetMs) {
    const result = await gql.request(SOURCES_TO_EMBED, { limit: BATCH_SIZE + failedKeys.size });
    remaining = result.ExpertRoleSource_aggregate.aggregate.count;
    const sources = result.ExpertRoleSource.filter((source) => !failedKeys.has(keyOf(source)));
    if (sources.length === 0) break;
    for (let index = 0; index < sources.length; index += CONCURRENCY) {
      await Promise.all(sources.slice(index, index + CONCURRENCY).map(embedSource));
    }
  }

  const failed = failedKeys.size;
  logger.info("Synced expert role embeddings", { deleted, embedded, failed, remaining });
  return { success: failed === 0, deleted, embedded, failed, remaining };
}
