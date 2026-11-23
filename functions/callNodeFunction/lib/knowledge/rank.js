/**
 * Ranking of knowledge passages (issue #2195): by similarity to the question, weighted by source in
 * the epic's order, so the organization's rules and the manual come before glossary and on-screen
 * texts, and those before code. Weights multiply, so they work on any provider's similarity scale.
 */

export const SOURCE_WEIGHTS = {
  ORGANIZATION_RULES: 1.2,
  MANUAL: 1.15,
  GLOSSARY: 1.08,
  LOCALE: 1.08,
  CODE: 1,
};

export const MAX_PASSAGES = 8;
// One file or page should not fill the answer on its own.
const MAX_PER_PATH = 2;
const MAX_CONTENT_CHARS = 1800;

export const rankPassages = (matches, { limit = MAX_PASSAGES } = {}) => {
  const perPath = new Map();
  return matches
    .map((match) => ({ ...match, score: match.similarity * (SOURCE_WEIGHTS[match.sourceType] ?? 1) }))
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .filter((match) => {
      const count = perPath.get(match.path) ?? 0;
      perPath.set(match.path, count + 1);
      return count < MAX_PER_PATH;
    })
    .slice(0, limit)
    .map(({ sourceType, title, url, content, language, similarity, score }) => ({
      sourceType,
      title,
      url,
      content: content.length > MAX_CONTENT_CHARS ? `${content.slice(0, MAX_CONTENT_CHARS)}…` : content,
      language: language ?? null,
      similarity: Math.round(similarity * 1000) / 1000,
      score: Math.round(score * 1000) / 1000,
    }));
};
