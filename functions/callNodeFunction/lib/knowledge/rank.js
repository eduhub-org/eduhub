/**
 * Ranking of knowledge passages (issue #2195): by similarity to the question, weighted by source in
 * the epic's order, so among passages about equally close the organization's rules and the manual
 * come before glossary and on-screen texts, and those before code. Weights multiply, so they work on
 * any provider's similarity scale. They are small on purpose: gemini-embedding-001 similarities of
 * relevant passages lie close together (about 0.65–0.8), and larger weights let a loosely related
 * rules page outrank the exact on-screen text of an error message (tuned with real embeddings).
 */

export const SOURCE_WEIGHTS = {
  ORGANIZATION_RULES: 1.04,
  MANUAL: 1.03,
  GLOSSARY: 1.015,
  LOCALE: 1.015,
  CODE: 1,
};

export const MAX_PASSAGES = 8;
// One file or page should not fill the answer on its own.
const MAX_PER_PATH = 2;
const MAX_CONTENT_CHARS = 1800;
const TEXTS_SHOWN = '\n\nTexts shown by this code:\n';
// Code a long code passage keeps at least, next to its (capped) list of texts.
const MIN_CODE_CHARS = 400;

/**
 * Caps a passage at MAX_CONTENT_CHARS. A code passage keeps its "Texts shown by this code" list,
 * which is often what matched an error message, and gives up code instead; its link still points at
 * all of its lines.
 */
const shorten = (content) => {
  if (content.length <= MAX_CONTENT_CHARS) return content;
  const at = content.indexOf(TEXTS_SHOWN);
  if (at === -1) return `${content.slice(0, MAX_CONTENT_CHARS)}…`;
  const texts = content.slice(at);
  const budget = Math.max(MAX_CONTENT_CHARS - texts.length - 1, MIN_CODE_CHARS);
  return at > budget ? `${content.slice(0, budget)}…${texts}` : content;
};

export const rankPassages = (matches, { limit = MAX_PASSAGES } = {}) => {
  const perPath = new Map();
  // The same rules are stored once per organization they apply to.
  const seen = new Set();
  return matches
    .map((match) => ({ ...match, score: match.similarity * (SOURCE_WEIGHTS[match.sourceType] ?? 1) }))
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .filter((match) => {
      const key = `${match.url}\n${match.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      const count = perPath.get(match.path) ?? 0;
      perPath.set(match.path, count + 1);
      return count < MAX_PER_PATH;
    })
    .slice(0, limit)
    .map(({ sourceType, title, url, content, language, similarity, score }) => ({
      sourceType,
      title,
      url,
      content: shorten(content),
      language: language ?? null,
      similarity: Math.round(similarity * 1000) / 1000,
      score: Math.round(score * 1000) / 1000,
    }));
};
