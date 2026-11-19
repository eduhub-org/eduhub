import { GraphQLClient } from "graphql-request";
import { embedText, embeddingConfig, toVectorLiteral } from "../lib/expertEmbeddings.js";

/**
 * The Expert Role sources (courses, sessions, projects, achievement options) whose text is closest
 * in meaning to a search (ADR 0004). Returns source ids and similarities only: the directory then
 * loads the people behind them under the caller's own role, so an org admin still only sees the
 * experts of their organization's courses.
 */

const MATCH_COUNT = 50;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const ALLOWED_ROLES = ["admin", "org_admin"];

const MATCH_EXPERT_ROLES = `
  query MatchExpertRoles($embedding: String!, $model: String!, $minSimilarity: float8!, $count: Int!) {
    match_expert_roles(
      args: {
        query_embedding: $embedding
        embedding_model: $model
        min_similarity: $minSimilarity
        match_count: $count
      }
    ) {
      sourceType
      sourceId
      similarity
    }
  }
`;

const client = () =>
  new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET },
  });

export default async function semanticExpertSearch(req, logger, { gql = client(), env = process.env, fetchImpl } = {}) {
  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.includes(role)) {
    return { success: false, enabled: false, matches: [], error: "Only admins and org admins can search experts" };
  }

  const config = embeddingConfig(env);
  if (!config) return { success: true, enabled: false, matches: [] };

  const query = String(req.body?.input?.query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < MIN_QUERY_LENGTH) return { success: true, enabled: true, matches: [] };

  try {
    const values = await embedText(config, query, "RETRIEVAL_QUERY", { fetchImpl });
    const result = await gql.request(MATCH_EXPERT_ROLES, {
      embedding: toVectorLiteral(values),
      model: config.modelKey,
      minSimilarity: config.minSimilarity,
      count: MATCH_COUNT,
    });
    return { success: true, enabled: true, matches: result.match_expert_roles };
  } catch (error) {
    // The keyword search still works; the directory just shows no similar experts.
    logger.warn("Semantic expert search failed", { error: error.message });
    return { success: false, enabled: true, matches: [], error: "Semantic search is currently unavailable" };
  }
}
