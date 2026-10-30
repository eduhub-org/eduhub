/**
 * Computes a Matrix-compatible user handle from user profile data.
 *
 * Format: {firstName}.{lastName}.{first6HexCharsOfUUID}
 *
 * Names are reduced to ASCII: diacritics are stripped (ü → u), Cyrillic and
 * Greek are transliterated (Иван → ivan, ICAO 9303 for Cyrillic), and a few
 * Latin letters without a decomposition are spelled out (ß → ss). Anything
 * left outside Matrix-safe [a-z0-9._-] is dropped; a name part that ends up
 * empty (e.g. a Chinese or Arabic name) falls back to "user".
 *
 * Keep in sync with MatrixHandleEventListenerProvider.computeHandle in
 * keycloak/spi/matrix-handle-listener: both must produce the same handle.
 *
 * Run tests: node --test matrixHandle.test.cjs
 */

// Greek digraphs (ELOT 743), applied before the per-letter map. αυ/ευ/ηυ
// become af/ef/if before a voiceless consonant or at the end of a word, and
// av/ev/iv otherwise; rewriting υ to φ/β lets the letter map finish the job.
const DIGRAPHS = [
  [/([αεη])υ(?=[θκξπσςτφχψ]|[^α-ω]|$)/g, "$1φ"],
  [/([αεη])υ/g, "$1β"],
  [/ου/g, "ou"],
  [/γγ/g, "ng"],
];

// Lowercase, after NFD + mark stripping (so й → и, ё → е, ά → α already).
const TRANSLITERATION = {
  // Cyrillic (Russian, Ukrainian, Belarusian, Serbian, Macedonian, Bulgarian)
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "ie",
  ы: "y", ь: "", э: "e", ю: "iu", я: "ia", і: "i", є: "ie", ґ: "g",
  ђ: "dj", ј: "j", љ: "lj", њ: "nj", ћ: "c", џ: "dz", ѕ: "dz",
  // Greek
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
  // Latin letters that NFD does not decompose
  ß: "ss", æ: "ae", ø: "o", œ: "oe", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i",
};

function sanitize(input) {
  let lowered = (input || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  for (const [from, to] of DIGRAPHS) {
    lowered = lowered.replace(from, to);
  }
  let out = "";
  for (const ch of lowered) {
    out += TRANSLITERATION[ch] ?? ch;
  }
  return out.replace(/[^a-z0-9._-]/g, "");
}

/**
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} userId - Keycloak UUID (with or without hyphens)
 * @returns {string} sanitized handle
 */
function computeMatrixHandle(firstName, lastName, userId) {
  const first = sanitize(firstName) || "user";
  const last = sanitize(lastName) || "user";
  const uuidPrefix = (userId || "").replace(/-/g, "").substring(0, 6);
  return `${first}.${last}.${uuidPrefix}`;
}

module.exports = { computeMatrixHandle };
