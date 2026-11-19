import { createHash } from "node:crypto";
import { env } from "./config.js";

/**
 * Embeddings for semantic expert search (ADR 0004, docs/EXPERT_DIRECTORY.md).
 *
 * EMBEDDING_PROVIDER selects the provider:
 * - "vertex": Google Vertex AI (production). Needs EMBEDDING_LOCATION; the project comes from
 *   EMBEDDING_PROJECT_ID or the metadata server, the token from the function's service account.
 * - "fake": a deterministic word-hashing embedding for local development and tests. It only finds
 *   texts that share words, which is enough to exercise the whole pipeline without credentials.
 * - unset: semantic search is off; the sync does nothing and the search reports it as disabled.
 */

export const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_VERTEX_MODEL = "gemini-embedding-001";
const FAKE_MODEL = "word-hash-768";
// Cosine similarities of the two providers live on different scales.
const DEFAULT_MIN_SIMILARITY = { vertex: 0.6, fake: 0.2 };
// gemini-embedding-001 reads up to 2048 tokens; longer course descriptions are cut, not rejected.
const MAX_TEXT_CHARS = 8000;
const METADATA_URL = "http://metadata.google.internal/computeMetadata/v1";
// The metadata server answers in milliseconds; without a bound a hung lookup would outlive the
// Vertex AI timeout and the whole invocation.
const METADATA_TIMEOUT_MS = 5_000;

/** `read` looks up one setting by name (lib/config.js by default; tests pass their own). */
export const embeddingConfig = (read = env) => {
  const provider = (read("EMBEDDING_PROVIDER") || "").trim().toLowerCase();
  if (provider !== "vertex" && provider !== "fake") return null;
  const model = provider === "vertex" ? read("EMBEDDING_MODEL") || DEFAULT_VERTEX_MODEL : FAKE_MODEL;
  const minSimilarity = Number(read("EXPERT_SEARCH_MIN_SIMILARITY"));
  return {
    provider,
    model,
    // Stored with every vector, so a provider or model change re-embeds everything.
    modelKey: `${provider}:${model}`,
    location: read("EMBEDDING_LOCATION"),
    projectId: read("EMBEDDING_PROJECT_ID"),
    minSimilarity: Number.isFinite(minSimilarity) ? minSimilarity : DEFAULT_MIN_SIMILARITY[provider],
  };
};

/** md5 of the source text, as Postgres computes it in the ExpertRoleSource view. */
export const contentHash = (text) => createHash("md5").update(text, "utf8").digest("hex");

/** Course and session texts hold HTML or Markdown; the embedding should only see the words. */
export const cleanText = (text) =>
  (text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[*_#`>|[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

/** pgvector's text form, which GraphQL passes through to the vector column. */
export const toVectorLiteral = (values) => `[${values.join(",")}]`;

const normalize = (values) => {
  const length = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return length === 0 ? values : values.map((value) => value / length);
};

export const fakeEmbedding = (text) => {
  const values = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const words = cleanText(text).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  words.forEach((word) => {
    const bucket = parseInt(createHash("md5").update(word).digest("hex").slice(0, 8), 16) % EMBEDDING_DIMENSIONS;
    values[bucket] += 1;
  });
  return normalize(values);
};

let cachedToken = null;

const metadata = async (path, fetchImpl) => {
  const response = await fetchImpl(`${METADATA_URL}/${path}`, {
    headers: { "Metadata-Flavor": "Google" },
    signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Metadata server answered ${response.status} for ${path}`);
  return response;
};

/** Access token of the function's service account, cached until shortly before it expires. */
const accessToken = async (fetchImpl) => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = await (await metadata("instance/service-accounts/default/token", fetchImpl)).json();
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
};

const vertexEmbedding = async (config, text, taskType, fetchImpl) => {
  if (!config.location) throw new Error("EMBEDDING_LOCATION is not set");
  const projectId = config.projectId || (await (await metadata("project/project-id", fetchImpl)).text());
  const url =
    `https://${config.location}-aiplatform.googleapis.com/v1/projects/${projectId}` +
    `/locations/${config.location}/publishers/google/models/${config.model}:predict`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(fetchImpl)}`, "Content-Type": "application/json" },
    // gemini-embedding-001 takes one text per request.
    body: JSON.stringify({
      instances: [{ content: text, task_type: taskType }],
      parameters: { outputDimensionality: EMBEDDING_DIMENSIONS, autoTruncate: true },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Vertex AI answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const values = (await response.json())?.predictions?.[0]?.embeddings?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Vertex AI returned no embedding of the expected size");
  }
  // Reduced-dimension gemini embeddings are not normalized; cosine distance does not need it, but
  // normalized vectors keep similarities comparable across texts.
  return normalize(values);
};

/**
 * Embeds one text. taskType is RETRIEVAL_DOCUMENT for role texts and RETRIEVAL_QUERY for a search,
 * so short queries land near the longer texts that answer them.
 */
export const embedText = async (config, text, taskType, { fetchImpl = globalThis.fetch } = {}) => {
  const cleaned = cleanText(text);
  if (!cleaned) throw new Error("Nothing to embed");
  return config.provider === "vertex" ? vertexEmbedding(config, cleaned, taskType, fetchImpl) : fakeEmbedding(cleaned);
};

/** A vector without direction (e.g. a fake embedding of words too short to count); pgvector's
 * cosine distance to it is NaN, which would match everything. */
export const isZeroVector = (values) => values.every((value) => value === 0);

/** For tests: forget the cached access token. */
export const resetTokenCache = () => {
  cachedToken = null;
};
