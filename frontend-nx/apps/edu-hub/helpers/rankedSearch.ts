/**
 * Hybrid search ranking (ADR 0004): one list of the items a keyword search and a semantic search
 * found, ranked in the browser. Generic over the item type; what counts as a keyword hit, how
 * strong it is and how similar an item is in meaning is up to the caller.
 */

/** How relevant an item is to the search, as both searches see it. */
export interface Relevance {
  /** Strength of the keyword hit, higher first; null when the keyword search does not list it. */
  keyword: number | null;
  /** Best semantic similarity, higher first; null when the semantic search did not find it. */
  similarity: number | null;
  /** Ranked before every other item, e.g. a search for a person's name. */
  pinned?: boolean;
  /** Breaks ties, higher first, e.g. a timestamp so that recent items come first. */
  tiebreak?: number;
}

export interface RankedSearchOptions<T, R> {
  /** The items the keyword search found, e.g. from the server's word filter. */
  keywordItems: T[];
  /** The items behind the semantic matches. An item in both lists is ranked once. */
  semanticItems: T[];
  /** Identifies an item across both lists. */
  idOf: (item: T) => string | number;
  /** The row to return for an item, and how relevant it is. */
  assess: (item: T) => { result: R; relevance: Relevance };
}

// Reciprocal rank fusion: each list adds 1 / (K + rank). K = 60 is the usual choice; it keeps
// an item found by both searches above one found by only one, without tuning weights to the
// different scales of keyword and cosine scores.
const RRF_K = 60;

/**
 * One list of the items the keyword and the semantic search found: pinned items come first;
 * everything else is ordered by reciprocal rank fusion of its rank in both searches, then by
 * tiebreak. Items neither search found are left out.
 */
export const rankSearchResults = <T, R>({
  keywordItems,
  semanticItems,
  idOf,
  assess,
}: RankedSearchOptions<T, R>): R[] => {
  const items = new Map<string | number, T>();
  [...keywordItems, ...semanticItems].forEach((item) => items.set(idOf(item), item));

  const candidates = Array.from(items.entries()).flatMap(([id, item]) => {
    const { result, relevance } = assess(item);
    if (relevance.keyword === null && relevance.similarity === null) return [];
    return [{ id, result, ...relevance, pinned: Boolean(relevance.pinned), tiebreak: relevance.tiebreak ?? 0 }];
  });
  type Candidate = (typeof candidates)[number];

  const rankBy = (value: (candidate: Candidate) => number | null) =>
    new Map(
      candidates
        .flatMap((candidate) => {
          const score = value(candidate);
          return score === null ? [] : [{ candidate, score }];
        })
        .sort((a, b) => b.score - a.score || b.candidate.tiebreak - a.candidate.tiebreak)
        .map(({ candidate }, index) => [candidate.id, index + 1])
    );
  const keywordRank = rankBy((candidate) => candidate.keyword);
  const semanticRank = rankBy((candidate) => candidate.similarity);
  const fused = (id: string | number) =>
    [keywordRank.get(id), semanticRank.get(id)].reduce<number>(
      (sum, rank) => (rank === undefined ? sum : sum + 1 / (RRF_K + rank)),
      0
    );

  return candidates
    .map((candidate) => ({ ...candidate, score: fused(candidate.id) }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.score - a.score || b.tiebreak - a.tiebreak)
    .map((candidate) => candidate.result);
};
