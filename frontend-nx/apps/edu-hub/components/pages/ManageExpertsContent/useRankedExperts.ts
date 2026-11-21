import { useCallback, useMemo } from 'react';

import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { useManageQuery } from '../../../hooks/authedQuery';
import { EXPERTS_LIST, SEMANTIC_EXPERT_SEARCH, SIMILAR_EXPERTS } from '../../../queries/experts';
import { ExpertsList } from '../../../queries/__generated__/ExpertsList';
import { SemanticExpertSearch } from '../../../queries/__generated__/SemanticExpertSearch';
import { SimilarExperts } from '../../../queries/__generated__/SimilarExperts';
import { EXPERT_SEARCH_FIELDS, rankExperts, sourcesCondition } from './expertDirectory';

/** Shorter searches stay a plain keyword filter of the server-paged table. */
export const MIN_RANKED_SEARCH_LENGTH = 3;
// Keyword candidates ranked in the browser. Org admins read at most 100 rows per query (Hasura
// permission limit); admins get more, as their searches span every organization.
const KEYWORD_CANDIDATES = { admin: 300, orgAdmin: 100 };

interface UseRankedExpertsOptions {
  /** The debounced search, as the table applies it. */
  search: string;
  isAdmin: boolean;
  scope: Record<string, unknown>;
  /** Order of the keyword candidates, so a capped list keeps the most recently active people. */
  orderBy: Record<string, unknown>[];
}

/**
 * The search results as one list ranked by relevance (ADR 0004): the people whose fields hold
 * every search word, and the people behind the roles the semantic search finds closest in
 * meaning, merged and ranked in the browser.
 */
export const useRankedExperts = ({ search, isAdmin, scope, orderBy }: UseRankedExpertsOptions) => {
  const query = search.trim();
  const active = query.length >= MIN_RANKED_SEARCH_LENGTH;

  const keyword = useManageQuery<ExpertsList>(EXPERTS_LIST, {
    variables: {
      isAdmin,
      scope,
      filter: createMultiWordSearchCondition(query, EXPERT_SEARCH_FIELDS),
      order_by: orderBy,
      offset: 0,
      limit: isAdmin ? KEYWORD_CANDIDATES.admin : KEYWORD_CANDIDATES.orgAdmin,
    },
    skip: !active,
  });

  const semantic = useManageQuery<SemanticExpertSearch>(SEMANTIC_EXPERT_SEARCH, {
    variables: { query },
    skip: !active,
  });
  const result = semantic.data?.semanticExpertSearch;
  const matches = useMemo(() => (active ? result?.matches ?? [] : []), [active, result]);

  const similar = useManageQuery<SimilarExperts>(SIMILAR_EXPERTS, {
    variables: { sources: sourcesCondition(matches), scope, isAdmin },
    skip: matches.length === 0,
  });

  const rows = useMemo(
    () =>
      active
        ? rankExperts(keyword.data?.User ?? [], matches.length ? similar.data?.User ?? [] : [], matches, query)
        : [],
    [active, keyword.data, similar.data, matches, query]
  );

  const { refetch: refetchKeyword } = keyword;
  const { refetch: refetchSimilar } = similar;
  const refetch = useCallback(async () => {
    if (!active) return;
    await Promise.all([refetchKeyword(), matches.length ? refetchSimilar() : null]);
  }, [active, matches.length, refetchKeyword, refetchSimilar]);

  return {
    /** Whether the search is long enough to be answered by this ranked list. */
    active,
    rows,
    loading: active && (keyword.loading || semantic.loading || similar.loading),
    error: active ? keyword.error : undefined,
    /** People with every search word; more than were ranked when the candidate limit cut them. */
    keywordTotal: keyword.data?.User_aggregate?.aggregate?.count ?? 0,
    keywordRanked: keyword.data?.User.length ?? 0,
    // A failed request or a failed search is not an empty result; a search that is turned off is.
    semanticUnavailable: active && Boolean(semantic.error || similar.error || result?.success === false),
    refetch,
  };
};
