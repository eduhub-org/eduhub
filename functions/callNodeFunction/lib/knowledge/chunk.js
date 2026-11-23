/**
 * Splitting texts into passages for the Assistant's knowledge index (issue #2195): documents by
 * heading, code by file and top-level function, each passage small enough to embed and to quote.
 */

export const DOC_MAX_CHARS = 1500;
export const DOC_OVERLAP_CHARS = 200;
export const CODE_MAX_CHARS = 2000;
const MIN_CODE_CHUNK_CHARS = 200;

/**
 * Heading anchor as the platform manual renders it (#2196): lowercase, umlauts as ae/oe/ue, ß as ss,
 * every other run of non-alphanumerics as one dash.
 */
export const headingId = (text) =>
  text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const unquote = (value) => value.replace(/^(['"])(.*)\1$/, '$2');

/**
 * The YAML front matter of a Markdown file, for the flat keys the manual uses (strings, numbers and
 * `[a, b]` lists). Returns the remaining body too.
 */
export const parseFrontMatter = (text) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const pair = /^([A-Za-z][\w-]*):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (!pair) return;
    const [, key, raw] = pair;
    const list = /^\[(.*)\]$/.exec(raw);
    data[key] = list
      ? list[1].split(',').map((item) => unquote(item.trim())).filter(Boolean)
      : unquote(raw);
  });
  return { data, body: text.slice(match[0].length) };
};

/** Splits text over maxChars at paragraph (else line, else hard) boundaries, with an overlap. */
export const splitLongText = (text, maxChars = DOC_MAX_CHARS, overlap = DOC_OVERLAP_CHARS) => {
  if (text.length <= maxChars) return [text];
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const cut = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('\n'));
      if (cut > maxChars / 2) end = start + cut;
    }
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return parts.filter(Boolean);
};

/**
 * Markdown sections by `#`, `##` and `###` heading (outside code fences). Each section carries its
 * heading trail ("Page › Section › Subsection") and the anchor of its own heading; long sections
 * are split with an overlap.
 */
export const chunkMarkdown = (markdown, { title: pageTitle, maxChars = DOC_MAX_CHARS, overlap = DOC_OVERLAP_CHARS } = {}) => {
  const sections = [];
  const trail = [];
  let current = { level: 0, heading: null, lines: [] };
  let inFence = false;
  const flush = () => {
    const body = current.lines.join('\n').trim();
    if (body) sections.push({ level: current.level, heading: current.heading, trail: [...trail], body });
  };
  markdown.split(/\r?\n/).forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) {
      current.lines.push(line);
      return;
    }
    flush();
    const level = heading[1].length;
    const text = heading[2].trim();
    trail.splice(level - 1);
    trail[level - 1] = text;
    current = { level, heading: text, lines: [] };
  });
  flush();

  return sections.flatMap(({ level, heading, trail: headings, body }) => {
    const names = headings.filter(Boolean);
    if (pageTitle && names[0] !== pageTitle) names.unshift(pageTitle);
    const sectionTitle = names.join(' › ') || pageTitle || '';
    // An h1 is the page itself: link to the page, not to an anchor.
    const anchor = heading && level > 1 ? headingId(heading) : null;
    return splitLongText(body, maxChars, overlap).map((text) => ({ title: sectionTitle, anchor, text }));
  });
};

const CODE_BOUNDARIES = {
  script:
    /^(export\s+(default\s+)?)?(declare\s+)?(async\s+)?(function\*?|const|let|var|class|interface|type|enum|abstract\s+class)\s|^export\s+default\s|^module\.exports/,
  python: /^(async\s+)?def\s|^class\s|^@/,
  graphql: /^(type|input|enum|scalar|interface|union|extend)\s/,
  yaml: /^[^\s#-]/,
};

const languageOf = (path) => {
  if (/\.(tsx?|jsx?|mjs|cjs)$/.test(path)) return 'script';
  if (/\.py$/.test(path)) return 'python';
  if (/\.graphql$/.test(path)) return 'graphql';
  if (/\.ya?ml$/.test(path)) return 'yaml';
  return 'script';
};

const NAME_PATTERNS = [
  /^(?:export\s+(?:default\s+)?)?(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)\s+([\w$]+)/,
  /^(?:async\s+)?def\s+(\w+)/,
  /^class\s+(\w+)/,
  /^(?:type|input|enum|scalar|interface|union)\s+(\w+)/,
  /^([\w.-]+):/,
];

const nameOf = (line) => {
  for (const pattern of NAME_PATTERNS) {
    const match = pattern.exec(line);
    if (match) return match[1];
  }
  return /^export\s+default/.test(line) ? 'default export' : null;
};

/**
 * Code by top-level declaration (function, component, class, type), with neighbouring small ones
 * merged up to maxChars and oversized ones split by lines. Each chunk keeps its line range for the
 * source link.
 */
export const chunkCode = (code, path, { maxChars = CODE_MAX_CHARS } = {}) => {
  const boundary = CODE_BOUNDARIES[languageOf(path)];
  const lines = code.split(/\r?\n/);
  // Segments start at a top-level declaration; comments and decorators right above it belong to it.
  const starts = [0];
  lines.forEach((line, index) => {
    if (index === 0 || !boundary.test(line)) return;
    let start = index;
    while (start > 0 && /^(\s*(\/\/|\/?\*|#(?!!)|@)|\s*\*\/)/.test(lines[start - 1]) && start - 1 > starts[starts.length - 1]) start -= 1;
    if (start > starts[starts.length - 1]) starts.push(start);
  });
  const segments = starts.map((start, i) => ({ start, end: (starts[i + 1] ?? lines.length) - 1 }));

  const chunks = [];
  let pending = null;
  const textOf = ({ start, end }) => lines.slice(start, end + 1).join('\n');
  const namesIn = ({ start, end }) =>
    lines
      .slice(start, end + 1)
      .map((line) => (boundary.test(line) ? nameOf(line) : null))
      .filter(Boolean);
  // `owner` names the declaration a piece of a long one belongs to.
  const emit = (segment, owner = []) => {
    const text = textOf(segment).trim();
    if (!text) return;
    const names = [...new Set([...owner, ...namesIn(segment)])];
    const previous = chunks[chunks.length - 1];
    // A few lines on their own (a closing export, the tail of a long declaration) say nothing; they
    // join the passage before them.
    if (previous && text.length < MIN_CODE_CHUNK_CHARS) {
      previous.text = `${previous.text}\n${text}`;
      previous.endLine = segment.end + 1;
      previous.names = [...new Set([...previous.names, ...names])];
      return;
    }
    chunks.push({ startLine: segment.start + 1, endLine: segment.end + 1, names, text });
  };

  segments.forEach((segment) => {
    const size = textOf(segment).length;
    if (size > maxChars) {
      if (pending) emit(pending);
      pending = null;
      // Split a long declaration by lines; every piece keeps the declaration's name.
      const owner = namesIn({ start: segment.start, end: segment.start + 40 }).slice(0, 1);
      let start = segment.start;
      let length = 0;
      for (let line = segment.start; line <= segment.end; line += 1) {
        length += lines[line].length + 1;
        if (length > maxChars && line > start) {
          emit({ start, end: line - 1 }, owner);
          start = line;
          length = lines[line].length + 1;
        }
      }
      emit({ start, end: segment.end }, owner);
      return;
    }
    if (pending && textOf({ start: pending.start, end: segment.end }).length <= maxChars) {
      pending = { start: pending.start, end: segment.end };
    } else {
      if (pending) emit(pending);
      pending = segment;
    }
  });
  if (pending) emit(pending);
  return chunks;
};

/** Every string value of a nested locale object, as [ 'a.b.c', 'text' ]. */
export const flattenLocale = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') return flattenLocale(value, path);
    return typeof value === 'string' ? [[path, value]] : [];
  });
