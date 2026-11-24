import fs from 'fs';
import path from 'path';

import { ManualAudience, ManualLanguage, parseManualPage } from './markdown';

/**
 * Loads the EduHub manual from docs/manual/<language>/ (server side only).
 *
 * Layout: docs/manual/<language>/index.md is the start page; every folder
 * below it is a section with an index.md (the section's intro) and one
 * Markdown file per page. A page's slug is its path without language and
 * `.md`, and is the same in every language: docs/manual/en/participants/registration.md
 * is /en/help/participants/registration, its German twin /help/participants/registration.
 */

export interface ManualPage {
  slug: string;
  title: string;
  summary: string;
  audience: ManualAudience[];
  language: ManualLanguage;
  order: number;
  body: string;
}

export interface ManualNavPage {
  slug: string;
  title: string;
}

export interface ManualNavSection extends ManualNavPage {
  pages: ManualNavPage[];
}

export interface Manual {
  language: ManualLanguage;
  start: ManualPage;
  sections: ManualNavSection[];
  pages: Map<string, ManualPage>;
}

/**
 * The manual lives at the repo root (docs/manual), outside the Next.js app.
 * MANUAL_DIR wins; otherwise look upwards from the working directory, which
 * finds it from frontend-nx/ on a host and from /opt/app in the Docker image
 * and dev container (both put it at /opt/docs/manual).
 */
export const findManualDir = (): string => {
  if (process.env.MANUAL_DIR) return process.env.MANUAL_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'docs', 'manual');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error('docs/manual not found; set MANUAL_DIR');
};

const listMarkdown = (dir: string, prefix = ''): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return listMarkdown(path.join(dir, entry.name), relative);
      return entry.name.endsWith('.md') ? [relative] : [];
    });

/** `participants/registration.md` → `participants/registration`, `participants/index.md` → `participants`. */
export const slugFromFile = (file: string): string => file.replace(/\.md$/, '').replace(/(^|\/)index$/, '');

const byOrder = (a: ManualPage, b: ManualPage) => a.order - b.order || a.title.localeCompare(b.title);

export const loadManual = (language: ManualLanguage, manualDir = findManualDir()): Manual => {
  const root = path.join(manualDir, language);
  const pages = new Map<string, ManualPage>();

  for (const file of listMarkdown(root)) {
    const location = `docs/manual/${language}/${file}`;
    const depth = file.split('/').length;
    if (depth > 2) throw new Error(`${location}: pages are at most one folder deep`);
    // Pages live in a section folder; only the start page sits at the top. This
    // keeps every slug unique and every page's links relative to its folder.
    if (depth === 1 && file !== 'index.md') throw new Error(`${location}: put the page in a section folder`);
    const { meta, body } = parseManualPage(fs.readFileSync(path.join(root, file), 'utf8'), location);
    const slug = slugFromFile(file);
    if (meta.slug !== slug) throw new Error(`${location}: slug "${meta.slug}" must be "${slug}"`);
    if (meta.language !== language) throw new Error(`${location}: language "${meta.language}" must be "${language}"`);
    pages.set(slug, { ...meta, body });
  }

  const start = pages.get('');
  if (!start) throw new Error(`docs/manual/${language}/index.md is missing`);

  const sections = [...pages.values()]
    .filter((page) => page.slug && !page.slug.includes('/'))
    .sort(byOrder)
    .map((section) => ({
      slug: section.slug,
      title: section.title,
      pages: [...pages.values()]
        .filter((page) => page.slug.startsWith(`${section.slug}/`))
        .sort(byOrder)
        .map(({ slug, title }) => ({ slug, title })),
    }));

  const orphan = [...pages.keys()].find((slug) => slug.includes('/') && !pages.has(slug.split('/')[0]));
  if (orphan) throw new Error(`docs/manual/${language}/${orphan.split('/')[0]}/index.md is missing`);

  return { language, start, sections, pages };
};
