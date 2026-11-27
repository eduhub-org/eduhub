import { createHasuraClient } from "../lib/hasura.js";
import { embedText, embeddingConfig, isZeroVector, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * The projects whose title, tagline and description are closest in meaning to a search, for the
 * projects overview (ADR 0009). Returns project ids and similarities only: the overview then loads
 * the projects under the caller's own role, with its filters, so an org admin still only sees the
 * projects of their organization's courses.
 */

// One vector per project, so 200 places are 200 different projects; the overview applies its
// status, program and course-group filters to them afterwards. An exact scan of a few thousand
// vectors.
const MATCH_COUNT = 200;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const ALLOWED_ROLES = ["admin", "org_admin"];

const MATCH_PROJECTS = `
  query MatchProjects(
    $embedding: String!
    $model: String!
    $minSimilarity: float8!
    $count: Int!
    $organizationIds: _int4
  ) {
    match_projects(
      args: {
        query_embedding: $embedding
        embedding_model: $model
        min_similarity: $minSimilarity
        match_count: $count
        organization_ids: $organizationIds
      }
    ) {
      projectId
      similarity
    }
  }
`;

// The organizations whose course or event programs an org admin manages: the grants that let them
// manage projects.
const MANAGED_ORGANIZATIONS = `
  query ProjectSearchOrganizations($userId: uuid!) {
    OrganizationAdmin(
      where: {
        userId: { _eq: $userId }
        _or: [{ canManageCourses: { _eq: true } }, { canManageEvents: { _eq: true } }]
      }
    ) {
      organizationId
    }
  }
`;

export default async function semanticProjectSearch(req, logger, { gql, read, fetchImpl } = {}) {
  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.includes(role)) {
    return { success: false, enabled: false, matches: [], error: "Only admins and org admins can search projects" };
  }

  const config = embeddingConfig(read);
  if (!config) return { success: true, enabled: false, matches: [] };

  const query = String(req.body?.input?.query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < MIN_QUERY_LENGTH) return { success: true, enabled: true, matches: [] };

  try {
    const client = gql ?? createHasuraClient();
    // Org admins only ever see projects of their organizations' courses, so only those projects
    // may take up the MATCH_COUNT places; admins match across all organizations.
    let organizationIds = null;
    if (role === "org_admin") {
      const userId = req.body?.session_variables?.["x-hasura-user-id"];
      const grants = (await client.request(MANAGED_ORGANIZATIONS, { userId })).OrganizationAdmin;
      if (grants.length === 0) return { success: true, enabled: true, matches: [] };
      organizationIds = `{${[...new Set(grants.map((grant) => grant.organizationId))].join(",")}}`;
    }

    const values = await embedText(config, query, "RETRIEVAL_QUERY", { fetchImpl });
    if (isZeroVector(values)) return { success: true, enabled: true, matches: [] };
    const result = await client.request(MATCH_PROJECTS, {
      embedding: toVectorLiteral(values),
      model: config.modelKey,
      minSimilarity: config.minSimilarity,
      count: MATCH_COUNT,
      organizationIds,
    });
    return { success: true, enabled: true, matches: result.match_projects };
  } catch (error) {
    // The keyword search still works; the overview just ranks without meaning.
    logger.warn("Semantic project search failed", { error: error.message });
    return { success: false, enabled: true, matches: [], error: "Semantic search is currently unavailable" };
  }
}
