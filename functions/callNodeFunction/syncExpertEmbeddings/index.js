import { createHasuraClient } from "../lib/hasura.js";
import { embedText, embeddingConfig, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * Keeps the embeddings of the semantic searches in step with their texts. Run nightly by one Hasura
 * cron trigger (sync_expert_embeddings), in two passes that share one time budget:
 * - Expert Roles (ADR 0004): course, session, project and achievement-option texts with people.
 * - Projects (ADR 0009): the title, tagline and description of every project.
 * Each pass drops vectors of another model (and, for Expert Roles, of sources that no longer have
 * instructors, speakers or mentors; a deleted project takes its vector along), then embeds new or
 * changed sources batch by batch until none are left or the time budget is used up. A first run on
 * an existing database backfills as much as fits; the following nights finish the rest.
 */

const BATCH_SIZE = 100;
const CONCURRENCY = 4;
// No new group of embeddings starts after this; a started group can still take up to the Vertex AI
// timeout (30 s) plus its writes, which keeps a run below the cron trigger's 170 s and
// callNodeFunction's 180 s.
const TIME_BUDGET_MS = 120_000;

const EXPERT_ROLES = {
  name: "expertRoles",
  deleteStale: `
    mutation DeleteStaleExpertRoleEmbeddings($model: String!) {
      delete_ExpertRoleEmbedding(where: { _or: [{ model: { _neq: $model } }, { _not: { Source: {} } }] }) {
        affected_rows
      }
    }
  `,
  deleted: (result) => result.delete_ExpertRoleEmbedding.affected_rows,
  sourcesToEmbed: `
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
  `,
  sources: (result) => result.ExpertRoleSource,
  pending: (result) => result.ExpertRoleSource_aggregate.aggregate.count,
  upsert: `
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
  `,
  keyOf: (source) => `${source.sourceType}:${source.sourceId}`,
  idColumns: (source) => ({ sourceType: source.sourceType, sourceId: source.sourceId }),
};

// Every project, mentored or not; mentored projects are also Expert Role sources above, on purpose
// (ADR 0009).
const PROJECTS = {
  name: "projects",
  // A deleted project's vector goes with it (ON DELETE CASCADE), so only other models are stale.
  deleteStale: `
    mutation DeleteStaleProjectEmbeddings($model: String!) {
      delete_ProjectEmbedding(where: { model: { _neq: $model } }) {
        affected_rows
      }
    }
  `,
  deleted: (result) => result.delete_ProjectEmbedding.affected_rows,
  sourcesToEmbed: `
    query ProjectSourcesToEmbed($limit: Int!) {
      ProjectEmbeddingSource(where: { needsEmbedding: { _eq: true } }, limit: $limit) {
        projectId
        text
        contentHash
      }
      ProjectEmbeddingSource_aggregate(where: { needsEmbedding: { _eq: true } }) {
        aggregate {
          count
        }
      }
    }
  `,
  sources: (result) => result.ProjectEmbeddingSource,
  pending: (result) => result.ProjectEmbeddingSource_aggregate.aggregate.count,
  upsert: `
    mutation UpsertProjectEmbedding($object: ProjectEmbedding_insert_input!) {
      insert_ProjectEmbedding_one(
        object: $object
        on_conflict: {
          constraint: ProjectEmbedding_projectId_unique
          update_columns: [model, contentHash, embedding]
        }
      ) {
        id
      }
    }
  `,
  keyOf: (source) => String(source.projectId),
  idColumns: (source) => ({ projectId: source.projectId }),
};

const PASSES = [EXPERT_ROLES, PROJECTS];

export default async function syncExpertEmbeddings(
  req,
  logger,
  { gql, read, fetchImpl, now = Date.now, timeBudgetMs = TIME_BUDGET_MS } = {}
) {
  const config = embeddingConfig(read);
  if (!config) return { success: true, skipped: "EMBEDDING_PROVIDER is not set" };
  gql = gql ?? createHasuraClient();

  const startedAt = now();
  const withinBudget = () => now() - startedAt < timeBudgetMs;

  // Stale vectors go first in every pass, so a model change never leaves mixed generations behind
  // for want of time.
  const stats = {};
  for (const pass of PASSES) {
    const deleted = pass.deleted(await gql.request(pass.deleteStale, { model: config.modelKey }));
    // remaining stays null for a pass the time budget did not reach.
    stats[pass.name] = { deleted, embedded: 0, failed: 0, remaining: null };
  }

  for (const pass of PASSES) {
    const counts = stats[pass.name];
    // Sources that failed in this run still need embedding; skipping them keeps them from blocking
    // the others. They are retried the next night.
    const failedKeys = new Set();

    const embedSource = async (source) => {
      try {
        const values = await embedText(config, source.text, "RETRIEVAL_DOCUMENT", { fetchImpl });
        await gql.request(pass.upsert, {
          object: {
            ...pass.idColumns(source),
            model: config.modelKey,
            contentHash: source.contentHash,
            embedding: toVectorLiteral(values),
          },
        });
        counts.embedded += 1;
        counts.remaining -= 1;
      } catch (error) {
        failedKeys.add(pass.keyOf(source));
        logger.warn(`Could not embed ${pass.name} ${pass.keyOf(source)}`, { error: error.message });
      }
    };

    // The deadline is checked before every group, not just every batch: with slow embedding calls
    // a whole batch could run far past it. Sources not reached stay pending for the next night.
    batches: while (withinBudget()) {
      const result = await gql.request(pass.sourcesToEmbed, { limit: BATCH_SIZE + failedKeys.size });
      counts.remaining = pass.pending(result);
      const sources = pass.sources(result).filter((source) => !failedKeys.has(pass.keyOf(source)));
      if (sources.length === 0) break;
      for (let index = 0; index < sources.length; index += CONCURRENCY) {
        if (!withinBudget()) break batches;
        await Promise.all(sources.slice(index, index + CONCURRENCY).map(embedSource));
      }
    }
    counts.failed = failedKeys.size;
  }

  logger.info("Synced embeddings", stats);
  return { success: PASSES.every((pass) => stats[pass.name].failed === 0), ...stats };
}
