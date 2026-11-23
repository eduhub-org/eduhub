/**
 * Pure helpers for the EduHub manual (docs/manual). No `fs` here, so the
 * /help page component can import them on the client.
 */

export const MANUAL_LANGUAGES = ['de', 'en'] as const;
export type ManualLanguage = (typeof MANUAL_LANGUAGES)[number];

export const MANUAL_AUDIENCES = ['participant', 'organizer', 'admin'] as const;
export type ManualAudience = (typeof MANUAL_AUDIENCES)[number];

export interface ManualFrontMatter {
  title: string;
  slug: string;
  audience: ManualAudience[];
  language: ManualLanguage;
  order: number;
  summary: string;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Reads the YAML front matter of a manual page. Only the flat subset the
 * manual uses is supported: `key: value` and `key: [a, b]`, with `# comments`. Throws on
 * anything missing or invalid, so a broken page fails the build and the
 * tests instead of rendering half a page.
 */
export const parseManualPage = (source: string, file = 'page'): { meta: ManualFrontMatter; body: string } => {
  const match = FRONT_MATTER.exec(source);
  if (!match) throw new Error(`${file}: missing front matter`);

  const raw: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const pair = /^([a-zA-Z]+):\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`${file}: cannot read front matter line "${line}"`);
    // A " #" after an unquoted value starts a YAML comment.
    const value = /^['"]/.test(pair[2].trim()) ? pair[2].trim() : pair[2].replace(/\s+#.*$/, '').trim();
    raw[pair[1]] = value.startsWith('[')
      ? value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((item) => unquote(item.trim()))
          .filter(Boolean)
      : unquote(value);
  }

  const text = (key: string): string => {
    const value = raw[key];
    if (typeof value !== 'string' || !value) throw new Error(`${file}: front matter "${key}" is required`);
    return value;
  };

  const language = text('language');
  if (!(MANUAL_LANGUAGES as readonly string[]).includes(language)) {
    throw new Error(`${file}: unknown language "${language}"`);
  }
  const audience = raw.audience;
  if (
    !Array.isArray(audience) ||
    audience.length === 0 ||
    audience.some((a) => !(MANUAL_AUDIENCES as readonly string[]).includes(a))
  ) {
    throw new Error(`${file}: audience must be a list of ${MANUAL_AUDIENCES.join(', ')}`);
  }
  const order = raw.order === undefined ? 100 : Number(raw.order);
  if (!Number.isFinite(order)) throw new Error(`${file}: order must be a number`);

  return {
    meta: {
      title: text('title'),
      // The start page (index.md at the language root) has the empty slug "".
      slug: typeof raw.slug === 'string' ? raw.slug : text('slug'),
      audience: audience as ManualAudience[],
      language: language as ManualLanguage,
      order,
      summary: text('summary'),
    },
    body: source.slice(match[0].length),
  };
};

const unquote = (value: string) => value.replace(/^(['"])(.*)\1$/, '$2');

/**
 * The id a manual heading gets, so `/help/<slug>#<id>` stays a stable link
 * the Assistant can cite. German umlauts are spelled out (ä → ae).
 */
export const headingId = (text: string): string =>
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

/** The /help path of a page slug ('' is the manual's start page). */
export const manualHref = (slug: string): string => (slug ? `/help/${slug}` : '/help');

/**
 * Turns a link inside a manual page into an app link. Pages link to each
 * other by relative file path (`../organizers/sessions.md#anchor`) so the
 * links also work on GitHub; in the app they become `/help/organizers/sessions#anchor`.
 * Other links are returned unchanged.
 */
export const resolveManualLink = (href: string, currentSlug: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('/') || href.startsWith('#')) return href;
  const [pathPart, hash] = href.split('#');
  if (!pathPart.endsWith('.md')) return href;

  // The file of the current page. Sections (slugs without "/") and the start
  // page are index.md files, so their links are relative to their own folder.
  const currentFile = currentSlug.includes('/') ? `${currentSlug}.md` : `${currentSlug}/index.md`.replace(/^\//, '');
  const parts = currentFile.split('/').slice(0, -1);
  for (const segment of pathPart.split('/')) {
    if (segment === '..') parts.pop();
    else if (segment !== '.' && segment !== '') parts.push(segment);
  }
  const target = parts
    .join('/')
    .replace(/\.md$/, '')
    .replace(/(^|\/)index$/, '');
  return manualHref(target) + (hash ? `#${hash}` : '');
};
