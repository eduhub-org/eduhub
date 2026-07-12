/**
 * Server-safe HTML sanitizer for employer-supplied rich text (legacy StuJo
 * postings were rendered with Rails `raw`, so descriptions carry markup).
 * DOMPurify needs a DOM and these pages are server-rendered, so instead the
 * whole string is entity-escaped first and a small allowlist of formatting
 * tags is then re-materialized from fixed templates: no attributes survive
 * (links get a rebuilt, protocol-checked href), so nothing from the input
 * can reach the DOM unescaped.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'hr',
  'div',
  'span',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Exact inverse of escapeHtml within already-escaped text (original `&` is
// `&amp;` there, so `&quot;`/`&lt;`/`&gt;` can only be our own escapes).
const unescapeHtml = (value: string): string =>
  value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Returns the value only if it is an absolute http(s) URL, else null. */
export const httpUrlOrNull = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

export const sanitizeHtml = (value: string): string => {
  // Drop script/style-like blocks with their contents up front — everything
  // is escaped below anyway, this just keeps their source out of the text.
  const withoutBlocks = value.replace(
    /<(script|style|iframe|object|noscript|template|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ''
  );
  const escaped = escapeHtml(withoutBlocks);
  return (
    escaped
      .replace(
        /&lt;(\/?)([a-z][a-z0-9]*)([\s\S]*?)\/?&gt;/gi,
        (_match, slash: string, rawTag: string, rawAttrs: string) => {
          const tag = rawTag.toLowerCase();
          if (ALLOWED_TAGS.has(tag)) return `<${slash}${tag}>`;
          if (tag === 'a') {
            if (slash) return '</a>';
            const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
              unescapeHtml(rawAttrs)
            );
            const url = httpUrlOrNull(href && (href[1] ?? href[2] ?? href[3]));
            return url
              ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener">`
              : '';
          }
          return '';
        }
      )
      // Restore well-formed character references the input already carried
      // (legacy content uses &uuml; & co). Entities only ever decode to text,
      // never to markup, so this cannot reintroduce tags or attributes.
      .replace(/&amp;([a-z][a-z0-9]*|#[0-9]{1,7}|#x[0-9a-f]{1,6});/gi, '&$1;')
  );
};
