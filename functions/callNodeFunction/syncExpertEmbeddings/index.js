import { GraphQLClient } from "graphql-request";
import { embedText, embeddingConfig, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * Keeps the Expert Role embeddings (ADR 0004) in step with the course, session, project and
 * achievement-option texts. Run by a Hasura cron trigger: it drops vectors of another model or of
 * sources that no longer have instructors, speakers or mentors, then embeds up to BATCH_SIZE new or
 * changed sources. A first run on an existing database therefore backfills over several runs.
 */

const BATCH_SIZE = 200;
const CONCURRENCY = 4;

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

export default async function syncExpertEmbeddings(req, logger, { gql = client(), env = process.env, fetchImpl } = {}) {
  const config = embeddingConfig(env);
  if (!config) return { success: true, skipped: "EMBEDDING_PROVIDER is not set" };

  const deleted = (await gql.request(DELETE_STALE, { model: config.modelKey })).delete_ExpertRoleEmbedding
    .affected_rows;
  const result = await gql.request(SOURCES_TO_EMBED, { limit: BATCH_SIZE });
  const sources = result.ExpertRoleSource;
  const pending = result.ExpertRoleSource_aggregate.aggregate.count;

  let embedded = 0;
  let failed = 0;
  for (let index = 0; index < sources.length; index += CONCURRENCY) {
    await Promise.all(
      sources.slice(index, index + CONCURRENCY).map(async (source) => {
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
        } catch (error) {
          // One bad text must not block the others; it is retried on the next run.
          failed += 1;
          logger.warn(`Could not embed ${source.sourceType} ${source.sourceId}`, { error: error.message });
        }
      })
    );
  }

  logger.info("Synced expert role embeddings", { deleted, embedded, failed, remaining: pending - embedded });
  return { success: failed === 0, deleted, embedded, failed, remaining: pending - embedded };
}
