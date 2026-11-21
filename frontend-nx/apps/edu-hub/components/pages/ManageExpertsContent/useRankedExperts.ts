import { useCallback, useEffect, useMemo, useState } from 'react';

import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { useManageQuery } from '../../../hooks/authedQuery';
import { EXPERTS_LIST, SEMANTIC_EXPERT_SEARCH, SIMILAR_EXPERTS } from '../../../queries/experts';
import { ExpertsList, ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { SemanticExpertSearch } from '../../../queries/__generated__/SemanticExpertSearch';
import { SimilarExperts } from '../../../queries/__generated__/SimilarExperts';
import { EXPERT_SEARCH_FIELDS, rankExperts, sourcesCondition } from './expertDirectory';

/** Shorter searches stay a plain keyword filter of the server-paged table. */
export const MIN_RANKED_SEARCH_LENGTH = 3;
// Keyword candidates ranked in the browser. Org admins read at most 100 rows per query (Hasura
// permission limit); admins get more, as their searches span every organization.
const KEYWORD_CANDIDATES = { admin: 300, orgAdmin: 100 };
// The people behind the semantic matches are read in pages of the org admin row limit, up to a
// bound that only a search matching nearly every source could reach.
const SIMILAR_PAGE_SIZE = 100;
const SIMILAR_PEOPLE_MAX = 1000;

interface SimilarPeople {
  users: ExpertsList_User[];
  /** False when SIMILAR_PEOPLE_MAX cut the list, so the results may miss someone. */
  complete: boolean;
  loading: boolean;
  error: boolean;
}

const NO_PEOPLE: SimilarPeople = { users: [], complete: true, loading: false, error: false };

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

  // Every person behind the matched sources, page by page under the role of the search, so the
  // ranking never works on an arbitrary subset (a single capped query would return one).
  const { client } = semantic;
  const context = semantic.observable?.options.context;
  const [similar, setSimilar] = useState<SimilarPeople>(NO_PEOPLE);
  const [reloads, setReloads] = useState(0);
  useEffect(() => {
    if (!matches.length) {
      setSimilar(NO_PEOPLE);
      return undefined;
    }
    let cancelled = false;
    setSimilar((previous) => ({ ...previous, loading: true }));
    const load = async (): Promise<SimilarPeople> => {
      const users: ExpertsList_User[] = [];
      for (let offset = 0; offset < SIMILAR_PEOPLE_MAX; offset += SIMILAR_PAGE_SIZE) {
        const { data } = await client.query<SimilarExperts>({
          query: SIMILAR_EXPERTS,
          variables: { sources: sourcesCondition(matches), scope, isAdmin, limit: SIMILAR_PAGE_SIZE, offset },
          context,
          fetchPolicy: 'network-only',
        });
        users.push(...(data.User as ExpertsList_User[]));
        if (data.User.length < SIMILAR_PAGE_SIZE) return { ...NO_PEOPLE, users };
      }
      return { ...NO_PEOPLE, users, complete: false };
    };
    load()
      .then((people) => !cancelled && setSimilar(people))
      .catch(() => !cancelled && setSimilar({ ...NO_PEOPLE, error: true }));
    return () => {
      cancelled = true;
    };
  }, [client, context, matches, scope, isAdmin, reloads]);

  const rows = useMemo(
    () => (active ? rankExperts(keyword.data?.User ?? [], similar.users, matches, query) : []),
    [active, keyword.data, similar.users, matches, query]
  );

  const { refetch: refetchKeyword } = keyword;
  const refetch = useCallback(async () => {
    if (!active) return;
    setReloads((count) => count + 1);
    await refetchKeyword();
  }, [active, refetchKeyword]);

  return {
    /** Whether the search is long enough to be answered by this ranked list. */
    active,
    rows,
    loading: active && (keyword.loading || semantic.loading || similar.loading),
    /** False when there were more people behind the semantic matches than could be ranked. */
    similarComplete: similar.complete,
    error: active ? keyword.error : undefined,
    /** People with every search word; more than were ranked when the candidate limit cut them. */
    keywordTotal: keyword.data?.User_aggregate?.aggregate?.count ?? 0,
    keywordRanked: keyword.data?.User.length ?? 0,
    // A failed request or a failed search is not an empty result; a search that is turned off is.
    semanticUnavailable: active && Boolean(semantic.error || similar.error || result?.success === false),
    refetch,
  };
};
