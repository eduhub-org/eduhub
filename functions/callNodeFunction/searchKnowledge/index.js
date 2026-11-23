import { env } from "../lib/config.js";
import { createHasuraClient } from "../lib/hasura.js";
import { embedText, embeddingConfig, isZeroVector, toVectorLiteral } from "../lib/expertEmbeddings.js";
import { rankPassages } from "../lib/knowledge/rank.js";

/**
 * The passages of the Assistant's knowledge index closest to a question (issue #2195), ranked with
 * the organization's rules and the manual before glossary, on-screen texts and code. Called by the
 * Assistant's `search_knowledge` tool as the asker (role `user`).
 *
 * The index only holds public content (docs, locale texts, released code; never database rows), so
 * every logged-in person may search it. Organization rules are the exception: only those of the
 * asker's organizations (their own, those they administer, those of courses they registered for)
 * and of the published course they are looking at are returned.
 */

// Candidates before ranking. Ranking keeps at most two per file and drops duplicates, so the pool
// is well above the eight passages returned: one file's sections can't crowd out the rest. The
// similarity floor still keeps unrelated passages out. An exact scan of a few thousand vectors.
const MATCH_COUNT = 80;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 1000;
// Cosine similarities of the providers live on different scales; fake ones are low for long texts.
// Vertex (gemini-embedding-001), tuned on real embeddings of the index: relevant passages scored
// 0.69–0.80 at the top and stayed above 0.62 down to the eighth, while off-topic questions (weather,
// poems, trivia) peaked at 0.51–0.60. 0.62 returns nothing for those and a full list for the rest.
const DEFAULT_MIN_SIMILARITY = { vertex: 0.62, fake: 0.05 };

const MATCH_KNOWLEDGE = `
  query MatchKnowledge(
    $embedding: String!
    $model: String!
    $minSimilarity: float8!
    $count: Int!
    $organizationIds: _int4!
  ) {
    match_knowledge(
      args: {
        query_embedding: $embedding
        embedding_model: $model
        min_similarity: $minSimilarity
        match_count: $count
        organization_ids: $organizationIds
      }
    ) {
      id
      sourceType
      language
      title
      path
      url
      content
      similarity
    }
  }
`;

const ASKER_ORGANIZATIONS = `
  query KnowledgeAskerOrganizations($userId: uuid!, $courseId: Int!, $withCourse: Boolean!) {
    User_by_pk(id: $userId) { organizationId }
    OrganizationAdmin(where: { userId: { _eq: $userId } }) { organizationId }
    CourseEnrollment(where: { userId: { _eq: $userId } }) { Course { Program { organizationId } } }
    PageCourse: Course(
      where: { id: { _eq: $courseId }, published: { _eq: true }, Program: { published: { _eq: true } } }
      limit: 1
    ) @include(if: $withCourse) {
      Program { organizationId }
    }
  }
`;

export const minSimilarityOf = (config, read) => {
  const configured = read("KNOWLEDGE_SEARCH_MIN_SIMILARITY");
  return configured && Number.isFinite(Number(configured)) ? Number(configured) : DEFAULT_MIN_SIMILARITY[config.provider];
};

const organizationIdsOf = (data) =>
  [
    data.User_by_pk?.organizationId,
    ...data.OrganizationAdmin.map((grant) => grant.organizationId),
    ...data.CourseEnrollment.map((enrollment) => enrollment.Course?.Program?.organizationId),
    // Only a course anyone may see: an unpublished course id must not unlock its organization.
    ...(data.PageCourse ?? []).map((course) => course.Program?.organizationId),
  ].filter((id) => Number.isInteger(id));

export default async function searchKnowledge(req, logger, { gql, read = env, fetchImpl } = {}) {
  const session = req.body?.session_variables ?? {};
  const userId = session["x-hasura-user-id"];
  const role = session["x-hasura-role"];
  if (!userId || !role || role === "anonymous") {
    return { success: false, enabled: false, passages: [], error: "Only logged-in users can search" };
  }

  const config = embeddingConfig(read);
  if (!config) return { success: true, enabled: false, passages: [] };

  const query = String(req.body?.input?.query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < MIN_QUERY_LENGTH) return { success: true, enabled: true, passages: [] };
  const courseId = Number.isInteger(req.body?.input?.courseId) ? req.body.input.courseId : null;

  try {
    const client = gql ?? createHasuraClient();
    const organizations = await client.request(ASKER_ORGANIZATIONS, {
      userId,
      courseId: courseId ?? 0,
      withCourse: courseId !== null,
    });
    const organizationIds = [...new Set(organizationIdsOf(organizations))];

    const values = await embedText(config, query, "RETRIEVAL_QUERY", { fetchImpl });
    if (isZeroVector(values)) return { success: true, enabled: true, passages: [] };
    const result = await client.request(MATCH_KNOWLEDGE, {
      embedding: toVectorLiteral(values),
      model: config.modelKey,
      minSimilarity: minSimilarityOf(config, read),
      count: MATCH_COUNT,
      organizationIds: `{${organizationIds.join(",")}}`,
    });
    return { success: true, enabled: true, passages: rankPassages(result.match_knowledge) };
  } catch (error) {
    logger.warn("Knowledge search failed", { error: error.message });
    return { success: false, enabled: true, passages: [], error: "The knowledge search is currently unavailable" };
  }
}
