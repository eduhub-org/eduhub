import { contentHash, embedText, isZeroVector, toVectorLiteral } from '../expertEmbeddings.js';

/**
 * Stores a new build of the Assistant's knowledge index (issue #2195). Passages whose text is
 * unchanged reuse their embedding; the rest are embedded. The new rows are written under a run id
 * that searches ignore until the last step, which in one transaction registers the run and removes
 * the previous one. Any failure before that leaves the previous index in place.
 *
 * Two runs may overlap (the workflow serializes its own runs, but the script can also be run by
 * hand). Cleanup therefore never touches rows of a run that may still be staging: it removes the
 * runs that were active when activating, and unfinished runs older than STALE_RUN_MS. A run whose
 * index row another activation replaced leaves orphan rows, which searches ignore (they join
 * KnowledgeIndex) and a later run cleans up once they are stale.
 */

const INSERT_BATCH = 100;
const LOOKUP_BATCH = 200;
const CONCURRENCY = 8;
// A build with far fewer passages than the live one is probably a broken checkout or source.
export const MIN_SHARE_OF_PREVIOUS = 0.5;
// Far longer than a run may take (the workflow times out after 30 minutes).
export const STALE_RUN_MS = 6 * 60 * 60 * 1000;

const ACTIVE_INDEX = `
  query KnowledgeIndexState {
    KnowledgeIndex { id release chunkCount }
  }
`;

const DELETE_UNFINISHED = `
  mutation DeleteUnfinishedKnowledgeRuns($activeIds: [String!]!, $staleBefore: timestamptz!) {
    delete_KnowledgeChunk(where: { indexRunId: { _nin: $activeIds }, created_at: { _lt: $staleBefore } }) {
      affected_rows
    }
  }
`;

const EXISTING_EMBEDDINGS = `
  query ExistingKnowledgeEmbeddings($model: String!, $hashes: [String!]!) {
    KnowledgeChunk(where: { model: { _eq: $model }, contentHash: { _in: $hashes } }, distinct_on: contentHash) {
      contentHash
      embedding
    }
  }
`;

const INSERT_CHUNKS = `
  mutation InsertKnowledgeChunks($objects: [KnowledgeChunk_insert_input!]!) {
    insert_KnowledgeChunk(objects: $objects) { affected_rows }
  }
`;

// Hasura runs the fields of one mutation in a single transaction.
const ACTIVATE = `
  mutation ActivateKnowledgeIndex(
    $index: KnowledgeIndex_insert_input!
    $runId: String!
    $previousIds: [String!]!
    $staleBefore: timestamptz!
  ) {
    insert_KnowledgeIndex_one(object: $index) { id }
    delete_KnowledgeChunk(
      where: {
        indexRunId: { _neq: $runId }
        _or: [{ indexRunId: { _in: $previousIds } }, { created_at: { _lt: $staleBefore } }]
      }
    ) {
      affected_rows
    }
    delete_KnowledgeIndex(where: { id: { _neq: $runId } }) { affected_rows }
  }
`;

/** The text that is embedded: the title gives a code or section passage its context. */
export const embeddingTextOf = (passage) => `${passage.title}\n${passage.content}`;

const inGroups = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

const checkSize = (count, previousCount, force) => {
  if (!force && count < previousCount * MIN_SHARE_OF_PREVIOUS) {
    throw new Error(`Only ${count} passages, the live index has ${previousCount}; not replacing it (use --force if intended)`);
  }
};

export async function buildKnowledgeIndex({
  passages,
  gql,
  config,
  release,
  runId,
  fetchImpl,
  logger,
  force = false,
  now = Date.now,
}) {
  if (passages.length === 0) throw new Error('No passages to index');
  const staleBefore = () => new Date(now() - STALE_RUN_MS).toISOString();
  const active = (await gql.request(ACTIVE_INDEX)).KnowledgeIndex;
  const previousCount = active.reduce((sum, index) => sum + index.chunkCount, 0);
  // Early, to save the embedding work; repeated below on what is actually stored.
  checkSize(passages.length, previousCount, force);
  // Rows of earlier builds that failed before they were activated (never a run still staging).
  await gql.request(DELETE_UNFINISHED, { activeIds: active.map((index) => index.id), staleBefore: staleBefore() });

  const rows = passages.map((passage) => {
    const text = embeddingTextOf(passage);
    return { passage, text, hash: contentHash(text) };
  });

  const known = new Map();
  for (const hashes of inGroups([...new Set(rows.map((row) => row.hash))], LOOKUP_BATCH)) {
    const result = await gql.request(EXISTING_EMBEDDINGS, { model: config.modelKey, hashes });
    result.KnowledgeChunk.forEach(({ contentHash: hash, embedding }) => known.set(hash, embedding));
  }

  const missing = [...new Set(rows.filter((row) => !known.has(row.hash)).map((row) => row.hash))];
  const textOf = new Map(rows.map((row) => [row.hash, row.text]));
  let embedded = 0;
  for (const group of inGroups(missing, CONCURRENCY)) {
    await Promise.all(
      group.map(async (hash) => {
        const values = await embedText(config, textOf.get(hash), 'RETRIEVAL_DOCUMENT', { fetchImpl });
        // A passage of only short words has no direction; it could never be found.
        known.set(hash, isZeroVector(values) ? null : toVectorLiteral(values));
        embedded += 1;
      })
    );
  }

  const objects = rows
    .filter((row) => known.get(row.hash))
    .map(({ passage, hash }) => ({
      indexRunId: runId,
      sourceType: passage.sourceType,
      organizationId: passage.organizationId ?? null,
      language: passage.language ?? null,
      title: passage.title,
      path: passage.path,
      url: passage.url,
      content: passage.content,
      contentHash: hash,
      model: config.modelKey,
      embedding: known.get(hash),
    }));
  // Passages without a direction are dropped above; what is left must still replace the index.
  checkSize(objects.length, previousCount, force);
  for (const batch of inGroups(objects, INSERT_BATCH)) {
    await gql.request(INSERT_CHUNKS, { objects: batch });
  }

  // Read again just before switching: only the run live right now is removed with it.
  const previousIds = (await gql.request(ACTIVE_INDEX)).KnowledgeIndex.map((index) => index.id);
  await gql.request(ACTIVATE, {
    runId,
    previousIds,
    staleBefore: staleBefore(),
    index: { id: runId, release, model: config.modelKey, chunkCount: objects.length },
  });

  const bySource = objects.reduce((counts, row) => ({ ...counts, [row.sourceType]: (counts[row.sourceType] ?? 0) + 1 }), {});
  const summary = { runId, release, chunks: objects.length, embedded, reused: rows.length - embedded, bySource };
  logger?.info('Built the knowledge index', summary);
  return summary;
}
