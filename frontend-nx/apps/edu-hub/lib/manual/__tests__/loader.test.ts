/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { findManualDir, loadManual, slugFromFile } from '../loader';
import { MANUAL_LANGUAGES, headingId, resolveManualLink } from '../markdown';

const front = (slug: string, title: string, extra = '') =>
  `---\ntitle: ${title}\nslug: ${slug}\naudience: [participant]\nlanguage: en\nsummary: About ${title}.\n${extra}---\nText of ${title}\n`;

const writeManual = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
};

describe('slugFromFile', () => {
  it.each([
    ['index.md', ''],
    ['participants/index.md', 'participants'],
    ['participants/registration.md', 'participants/registration'],
    ['participants/reindex.md', 'participants/reindex'],
  ])('%s → %s', (file, slug) => {
    expect(slugFromFile(file)).toBe(slug);
  });
});

describe('loadManual', () => {
  it('builds the sections in order, with their pages in order', () => {
    const dir = writeManual({
      'en/index.md': front('', 'Manual'),
      'en/organizers/index.md': front('organizers', 'For Organizers', 'order: 20\n'),
      'en/organizers/sessions.md': front('organizers/sessions', 'Sessions', 'order: 20\n'),
      'en/organizers/course-setup.md': front('organizers/course-setup', 'Setting up', 'order: 10\n'),
      'en/participants/index.md': front('participants', 'For participants', 'order: 10\n'),
      'en/participants/registration.md': front('participants/registration', 'Registering'),
      'en/notes.txt': 'not markdown',
    });
    const manual = loadManual('en', dir);

    expect(manual.start.title).toBe('Manual');
    expect(manual.sections).toEqual([
      { slug: 'participants', title: 'For participants', pages: [{ slug: 'participants/registration', title: 'Registering' }] },
      {
        slug: 'organizers',
        title: 'For Organizers',
        pages: [
          { slug: 'organizers/course-setup', title: 'Setting up' },
          { slug: 'organizers/sessions', title: 'Sessions' },
        ],
      },
    ]);
    expect(manual.pages.get('organizers/sessions')?.body).toBe('Text of Sessions\n');
  });

  it('rejects a slug that does not match the file', () => {
    const dir = writeManual({ 'en/index.md': front('', 'Manual'), 'en/a/index.md': front('b', 'A') });
    expect(() => loadManual('en', dir)).toThrow('docs/manual/en/a/index.md: slug "b" must be "a"');
  });

  it('rejects a page in the wrong language folder', () => {
    const dir = writeManual({ 'de/index.md': front('', 'Manual') });
    expect(() => loadManual('de', dir)).toThrow('language "en" must be "de"');
  });

  it('requires the start page and section intros', () => {
    expect(() => loadManual('en', writeManual({ 'en/a/index.md': front('a', 'A') }))).toThrow('en/index.md is missing');
    expect(() =>
      loadManual('en', writeManual({ 'en/index.md': front('', 'Manual'), 'en/a/b.md': front('a/b', 'B') }))
    ).toThrow('en/a/index.md is missing');
  });

  it('rejects pages outside a section folder', () => {
    // topics.md would clash with topics/index.md and resolve its links wrongly.
    const dir = writeManual({ 'en/index.md': front('', 'Manual'), 'en/topics.md': front('topics', 'Topics') });
    expect(() => loadManual('en', dir)).toThrow('docs/manual/en/topics.md: put the page in a section folder');
  });

  it('rejects pages nested more than one folder deep', () => {
    const dir = writeManual({ 'en/index.md': front('', 'Manual'), 'en/a/b/c.md': front('a/b/c', 'C') });
    expect(() => loadManual('en', dir)).toThrow('at most one folder deep');
  });
});

describe('findManualDir', () => {
  const original = process.env.MANUAL_DIR;
  afterEach(() => {
    if (original === undefined) delete process.env.MANUAL_DIR;
    else process.env.MANUAL_DIR = original;
  });

  it('prefers MANUAL_DIR', () => {
    process.env.MANUAL_DIR = '/somewhere/manual';
    expect(findManualDir()).toBe('/somewhere/manual');
  });

  it('finds docs/manual above the working directory', () => {
    delete process.env.MANUAL_DIR;
    expect(fs.existsSync(path.join(findManualDir(), 'de', 'index.md'))).toBe(true);
  });
});

// The real manual in docs/manual: the Assistant cites these pages by link, so
// broken pages, missing translations and dead links fail CI.
describe('docs/manual', () => {
  const manuals = Object.fromEntries(MANUAL_LANGUAGES.map((language) => [language, loadManual(language)]));

  it('has the same pages in every language', () => {
    const [first, ...rest] = MANUAL_LANGUAGES.map((language) => [...manuals[language].pages.keys()].sort());
    rest.forEach((slugs) => expect(slugs).toEqual(first));
  });

  it('covers the most common questions', () => {
    expect([...manuals.en.pages.keys()]).toEqual(
      expect.arrayContaining([
        'participants/registration',
        'participants/invitations-and-waitlist',
        'participants/attendance-and-certificates',
        'organizers/course-setup',
        'organizers/sessions',
        'organizers/assistant',
      ])
    );
  });

  it.each(MANUAL_LANGUAGES)('has only working links between pages (%s)', (language) => {
    const manual = manuals[language];
    const ids = (body: string) =>
      new Set([...body.matchAll(/^#{2,3} (.+)$/gm)].map((match) => headingId(match[1].trim())));
    const broken: string[] = [];

    for (const page of manual.pages.values()) {
      for (const [, href] of page.body.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = resolveManualLink(href, page.slug);
        if (!target.startsWith('/help') && !target.startsWith('#')) continue;
        const [pathPart, hash] = target.split('#');
        const slug = pathPart ? pathPart.replace(/^\/help\/?/, '') : page.slug;
        const targetPage = manual.pages.get(slug);
        if (!targetPage || (hash && !ids(targetPage.body).has(hash))) broken.push(`${page.slug || 'index'} → ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it.each(MANUAL_LANGUAGES)('has unique heading ids on every page (%s)', (language) => {
    // Anchors are cited as /help/<slug>#<id>; a duplicate would be ambiguous.
    for (const page of manuals[language].pages.values()) {
      const ids = [...page.body.matchAll(/^#{2,3} (.+)$/gm)].map((match) => headingId(match[1].trim()));
      expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    }
  });

  it('uses the informal "Du" in German', () => {
    // A capitalised Sie/Ihr in mid-sentence is the formal address; at the
    // start of a sentence it can mean "they", so only mid-sentence counts.
    const formal = /[a-zäöüß,]\s+(Sie|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihnen)\b/;
    for (const page of manuals.de.pages.values()) {
      expect(`${page.title} ${page.summary} ${page.body}`).not.toMatch(formal);
    }
  });
});
