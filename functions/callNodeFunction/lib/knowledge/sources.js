import fs from 'node:fs';
import path from 'node:path';
import { chunkCode, chunkMarkdown, flattenLocale, parseFrontMatter, splitLongText } from './chunk.js';
import { findSecrets, redactEmails, sourceTypeOf } from './safety.js';

/**
 * The passages of the Assistant's knowledge index (issue #2195), in the epic's order: the
 * organization's rules (GitBook), the platform manual (docs/manual, #2196), the glossary
 * (CONTEXT.md) and the locale files, and the source code of the released tag. Everything but
 * GitBook comes from a checkout of that tag.
 *
 * A passage is { sourceType, organizationId, language, title, path, url, content }.
 */

export const REPO_URL = 'https://github.com/eduhub-org/eduhub';
const LOCALE_MAX_CHARS = 1500;
// Translation texts a code passage shows, appended so an error message on screen finds the code
// that raises it.
const MAX_MESSAGES_PER_CODE_CHUNK = 12;
const MAX_MESSAGE_CHARS = 200;
const MAX_MESSAGES_CHARS = 1200;

/** Every regular file below dir, as repo-relative paths; symlinks and dot-folders are skipped. */
export const listFiles = (root) => {
  const files = [];
  const walk = (relative) => {
    fs.readdirSync(path.join(root, relative), { withFileTypes: true }).forEach((entry) => {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) return;
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') return;
        walk(child);
      } else if (entry.isFile()) {
        files.push(child);
      }
    });
  };
  walk('');
  return files.sort();
};

const blobUrl = (release, file, startLine, endLine) =>
  `${REPO_URL}/blob/${encodeURIComponent(release)}/${file}${startLine ? `#L${startLine}${endLine && endLine !== startLine ? `-L${endLine}` : ''}` : ''}`;

/** The manual's page URL (#2196): /help/<slug> in German (default locale), /en/help/<slug> in English. */
export const manualUrl = (language, slug, anchor) =>
  `${language === 'en' ? '/en' : ''}/help/${slug.replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') + (anchor ? `#${anchor}` : '');

/** Relative links between manual pages (`../organizers/sessions.md#x`) as /help URLs. */
export const resolveManualLinks = (markdown, language, relative) =>
  markdown.replace(/\]\((?!https?:|mailto:|#|\/)([^)\s]+?)\.md(#[^)\s]*)?\)/g, (_, target, anchor = '') => {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relative), target));
    return `](${manualUrl(language, resolved.replace(/^(\.\.\/)+/, ''))}${anchor})`;
  });

const manualPassages = (file, text) => {
  const [, language, relative] = /^docs\/manual\/(de|en)\/(.+)\.md$/.exec(file);
  const { data, body: raw } = parseFrontMatter(text);
  // An empty `slug:` is the start page (/help); without the key the path stands in.
  const slug = data.slug ?? relative;
  const body = resolveManualLinks(raw, language, relative);
  const title = data.title || /^#\s+(.+)$/m.exec(body)?.[1] || slug;
  const audience = Array.isArray(data.audience) ? data.audience.join(', ') : data.audience;
  const preface = [data.summary, audience ? `Audience: ${audience}` : null].filter(Boolean).join('\n');
  return chunkMarkdown(body, { title }).map((chunk, index) => ({
    sourceType: 'MANUAL',
    language,
    title: chunk.title,
    path: file,
    url: manualUrl(language, slug, chunk.anchor),
    content: index === 0 && preface ? `${preface}\n\n${chunk.text}` : chunk.text,
  }));
};

const glossaryPassages = (file, text, release) =>
  chunkMarkdown(text, { title: 'Glossary (CONTEXT.md)' }).map((chunk) => ({
    sourceType: 'GLOSSARY',
    language: 'en',
    title: chunk.title,
    path: file,
    url: `${blobUrl(release, file)}${chunk.anchor ? `#${chunk.anchor}` : ''}`,
    content: chunk.text,
  }));

/** Locale texts grouped by top-level key, as `key.path: text` lines, so answers use on-screen labels. */
const localePassages = (file, text, release) => {
  const language = /\/(de|en)\.json$/.exec(file)[1];
  const app = /apps\/([^/]+)\//.exec(file)[1];
  const lines = text.split(/\r?\n/);
  const lineOf = (key) => lines.findIndex((line) => line.startsWith(`  "${key}"`)) + 1 || null;
  return Object.entries(JSON.parse(text)).flatMap(([group, value]) => {
    const entries = typeof value === 'object' && value ? flattenLocale(value, group) : [[group, String(value)]];
    const body = entries.map(([key, message]) => `${key}: ${message}`).join('\n');
    const line = lineOf(group);
    return splitLongText(body, LOCALE_MAX_CHARS, 0).map((part) => ({
      sourceType: 'LOCALE',
      language,
      title: `On-screen texts (${app}, ${language}): ${group}`,
      path: file,
      url: blobUrl(release, file, line),
      content: part,
    }));
  });
};

const STRING_LITERAL = /(['"`])([\w.-]{2,120})\1/g;
const NAMESPACE = /(?:useTranslations|getTranslations)\(\s*(?:\{\s*namespace:\s*)?['"`]([\w.-]+)['"`]/g;

// Error and status codes map 1:1 to ALL_CAPS locale keys (e.g. assistant.errors.RATE_LIMITED_SHORT),
// often looked up dynamically (`errors.${code}`), so a code literal links to keys ending in it.
const CODE_LITERAL = /^[A-Z][A-Z0-9_]{4,}$/;
const MAX_KEYS_PER_CODE_LITERAL = 3;

/**
 * The locale texts a code passage refers to: literal keys, keys relative to the file's namespaces,
 * and ALL_CAPS codes.
 */
const messagesFor = (code, namespaces, messages) => {
  const found = new Map();
  for (const [, , literal] of code.matchAll(STRING_LITERAL)) {
    const keys = ['', ...namespaces].map((prefix) => (prefix ? `${prefix}.${literal}` : literal));
    if (CODE_LITERAL.test(literal)) {
      const byCode = messages.byLeaf.get(literal) ?? [];
      if (byCode.length <= MAX_KEYS_PER_CODE_LITERAL) keys.push(...byCode);
    }
    keys.forEach((key) => {
      if (messages.has(key) && !found.has(key)) found.set(key, messages.get(key));
    });
    if (found.size >= MAX_MESSAGES_PER_CODE_CHUNK) break;
  }
  return [...found.entries()].slice(0, MAX_MESSAGES_PER_CODE_CHUNK);
};

const codePassages = (file, text, release, messages) => {
  const namespaces = [...new Set([...text.matchAll(NAMESPACE)].map((match) => match[1]))];
  return chunkCode(text, file).map((chunk) => {
    const shown = messagesFor(chunk.text, namespaces, messages);
    const shows = shown.length
      ? `\n\nTexts shown by this code:\n${shown
          .map(([key, { de, en }]) => `${key}: ${[de, en].filter(Boolean).join(' / ')}`.slice(0, MAX_MESSAGE_CHARS))
          .join('\n')}`.slice(0, MAX_MESSAGES_CHARS)
      : '';
    return {
      sourceType: 'CODE',
      language: null,
      title: `${file}${chunk.names.length ? ` › ${chunk.names.slice(0, 3).join(', ')}` : ''}`,
      path: file,
      url: blobUrl(release, file, chunk.startLine, chunk.endLine),
      content: `${chunk.text}${shows}`,
    };
  });
};

/**
 * key → { de, en } over all locale files, for linking code to the texts it shows; `byLeaf` finds the
 * keys of an ALL_CAPS code.
 */
const localeMessages = (root, files) => {
  const messages = new Map();
  messages.byLeaf = new Map();
  files
    .filter((file) => sourceTypeOf(file) === 'LOCALE')
    .forEach((file) => {
      const language = /\/(de|en)\.json$/.exec(file)[1];
      flattenLocale(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))).forEach(([key, message]) => {
        if (!messages.has(key)) {
          const leaf = key.slice(key.lastIndexOf('.') + 1);
          if (CODE_LITERAL.test(leaf)) messages.byLeaf.set(leaf, [...(messages.byLeaf.get(leaf) ?? []), key]);
        }
        messages.set(key, { ...messages.get(key), [language]: message });
      });
    });
  return messages;
};

/**
 * Drops passages with anything that looks like a secret (whole passage, reported by path only) and
 * replaces personal e-mail addresses.
 */
export const sanitizePassages = (passages, logger) =>
  passages.flatMap((passage) => {
    const secrets = findSecrets(passage.content);
    if (secrets.length) {
      logger?.warn('Skipped a knowledge passage that looks like it holds a secret', { path: passage.path, secrets });
      return [];
    }
    return [{ ...passage, title: redactEmails(passage.title), content: redactEmails(passage.content) }];
  });

/** All passages of a checkout of `release` (a git tag). */
export const collectRepoPassages = (root, { release, logger } = {}) => {
  const files = listFiles(root).filter((file) => sourceTypeOf(file));
  const messages = localeMessages(root, files);
  const passages = files.flatMap((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    if (!text.trim()) return [];
    switch (sourceTypeOf(file)) {
      case 'MANUAL':
        return manualPassages(file, text);
      case 'GLOSSARY':
        return glossaryPassages(file, text, release);
      case 'LOCALE':
        return localePassages(file, text, release);
      default:
        return codePassages(file, text, release, messages);
    }
  });
  return sanitizePassages(passages, logger);
};

/**
 * The organization's rules from a public GitBook space: its llms.txt lists every page with a link to
 * the page's Markdown export. All pages belong to organizationId.
 */
export const fetchGitbookPassages = async (baseUrl, { organizationId, fetchImpl = globalThis.fetch, logger, concurrency = 4 }) => {
  const base = baseUrl.replace(/\/$/, '');
  const get = async (url) => {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`GitBook answered ${response.status} for ${url}`);
    return response.text();
  };
  const index = await get(`${base}/llms.txt`);
  const pages = [...index.matchAll(/^\s*-\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+\.md)\)/gm)]
    .map(([, title, url]) => ({ title, url }))
    // Only pages of this space, never links to elsewhere.
    .filter(({ url }) => url.startsWith(`${base}/`));
  if (pages.length === 0) throw new Error(`No pages listed in ${base}/llms.txt`);

  const passages = [];
  for (let i = 0; i < pages.length; i += concurrency) {
    const texts = await Promise.all(pages.slice(i, i + concurrency).map(({ url }) => get(url)));
    texts.forEach((text, j) => {
      const { title, url } = pages[i + j];
      const pageUrl = url.replace(/\.md$/, '');
      chunkMarkdown(parseFrontMatter(text).body, { title }).forEach((chunk) => {
        passages.push({
          sourceType: 'ORGANIZATION_RULES',
          organizationId,
          language: 'de',
          title: chunk.title,
          path: pageUrl.slice(base.length + 1) || 'index',
          // GitBook builds its anchors its own way; link the page.
          url: pageUrl,
          content: chunk.text,
        });
      });
    });
  }
  return sanitizePassages(passages, logger);
};
