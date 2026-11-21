import { createHasuraClient } from "../lib/hasura.js";
import { embedText, embeddingConfig, isZeroVector, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * The Expert Role sources (courses, sessions, projects, achievement options) whose text is closest
 * in meaning to a search (ADR 0004). Returns source ids and similarities only: the directory then
 * loads the people behind them under the caller's own role, so an org admin still only sees the
 * experts of their organization's courses.
 */

// Courses repeat every semester with the same session texts, so near-identical sources fill the top
// places; 200 leaves room for enough different people. An exact scan of a few thousand vectors.
const MATCH_COUNT = 200;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const ALLOWED_ROLES = ["admin", "org_admin"];

const MATCH_EXPERT_ROLES = `
  query MatchExpertRoles(
    $embedding: String!
    $model: String!
    $minSimilarity: float8!
    $count: Int!
    $organizationIds: _int4
  ) {
    match_expert_roles(
      args: {
        query_embedding: $embedding
        embedding_model: $model
        min_similarity: $minSimilarity
        match_count: $count
        organization_ids: $organizationIds
      }
    ) {
      sourceType
      sourceId
      similarity
    }
  }
`;

// The organizations whose programs an org admin manages (the same grants as the directory scope).
const MANAGED_ORGANIZATIONS = `
  query ExpertSearchOrganizations($userId: uuid!) {
    OrganizationAdmin(
      where: {
        userId: { _eq: $userId }
        _or: [
          { canManageCourses: { _eq: true } }
          { canManageEvents: { _eq: true } }
          { canManageDegrees: { _eq: true } }
          { canManageSettings: { _eq: true } }
        ]
      }
    ) {
      organizationId
    }
  }
`;

export default async function semanticExpertSearch(req, logger, { gql, read, fetchImpl } = {}) {
  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.includes(role)) {
    return { success: false, enabled: false, matches: [], error: "Only admins and org admins can search experts" };
  }

  const config = embeddingConfig(read);
  if (!config) return { success: true, enabled: false, matches: [] };

  const query = String(req.body?.input?.query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < MIN_QUERY_LENGTH) return { success: true, enabled: true, matches: [] };

  try {
    const client = gql ?? createHasuraClient();
    // Org admins only ever see experts of their organizations' courses, so only those sources may
    // take up the MATCH_COUNT places; admins match across all organizations.
    let organizationIds = null;
    if (role === "org_admin") {
      const userId = req.body?.session_variables?.["x-hasura-user-id"];
      const grants = (await client.request(MANAGED_ORGANIZATIONS, { userId })).OrganizationAdmin;
      if (grants.length === 0) return { success: true, enabled: true, matches: [] };
      organizationIds = `{${[...new Set(grants.map((grant) => grant.organizationId))].join(",")}}`;
    }

    const values = await embedText(config, query, "RETRIEVAL_QUERY", { fetchImpl });
    if (isZeroVector(values)) return { success: true, enabled: true, matches: [] };
    const result = await client.request(MATCH_EXPERT_ROLES, {
      embedding: toVectorLiteral(values),
      model: config.modelKey,
      minSimilarity: config.minSimilarity,
      count: MATCH_COUNT,
      organizationIds,
    });
    return { success: true, enabled: true, matches: result.match_expert_roles };
  } catch (error) {
    // The keyword search still works; the directory just shows no similar experts.
    logger.warn("Semantic expert search failed", { error: error.message });
    return { success: false, enabled: true, matches: [], error: "Semantic search is currently unavailable" };
  }
}
