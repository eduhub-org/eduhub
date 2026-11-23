import { headingId, manualHref, parseManualPage, resolveManualLink } from '../markdown';

const page = (frontMatter: string, body = 'Body text') => `---\n${frontMatter}\n---\n${body}`;

const valid = [
  'title: Registering and applying',
  'slug: participants/registration',
  'audience: [participant, organizer]',
  'language: en',
  'order: 10',
  'summary: How to register.',
].join('\n');

describe('parseManualPage', () => {
  it('reads the front matter and returns the body', () => {
    const { meta, body } = parseManualPage(page(valid, '## Heading\n\nText'));
    expect(meta).toEqual({
      title: 'Registering and applying',
      slug: 'participants/registration',
      audience: ['participant', 'organizer'],
      language: 'en',
      order: 10,
      summary: 'How to register.',
    });
    expect(body).toBe('## Heading\n\nText');
  });

  it('allows the empty slug of the start page and a missing order', () => {
    const { meta } = parseManualPage(page(valid.replace('slug: participants/registration', 'slug:').replace('order: 10\n', '')));
    expect(meta.slug).toBe('');
    expect(meta.order).toBe(100);
  });

  it('ignores YAML comments after unquoted values', () => {
    const { meta } = parseManualPage(
      page(
        valid
          .replace('language: en', 'language: en   # de or en')
          .replace('[participant, organizer]', '[participant, organizer] # who it is for')
          .replace('order: 10', 'order: 10 # position')
      )
    );
    expect(meta).toMatchObject({ language: 'en', audience: ['participant', 'organizer'], order: 10 });
  });

  it('accepts quoted values', () => {
    const { meta } = parseManualPage(page(valid.replace('title: Registering and applying', 'title: "Why: this"')));
    expect(meta.title).toBe('Why: this');
  });

  it.each([
    ['no front matter', 'Just text'],
    ['a missing title', page(valid.replace('title: Registering and applying\n', ''))],
    ['a missing slug', page(valid.replace('slug: participants/registration\n', ''))],
    ['an unknown language', page(valid.replace('language: en', 'language: fr'))],
    ['an unknown audience', page(valid.replace('[participant, organizer]', '[student]'))],
    ['an empty audience', page(valid.replace('[participant, organizer]', '[]'))],
    ['a non-numeric order', page(valid.replace('order: 10', 'order: first'))],
    ['an unreadable line', page(`${valid}\n- list item`)],
  ])('rejects %s', (_, source) => {
    expect(() => parseManualPage(source, 'test.md')).toThrow(/^test\.md: /);
  });
});

describe('headingId', () => {
  it.each([
    ['Course titles must be unique', 'course-titles-must-be-unique'],
    ['Kurstitel müssen eindeutig sein', 'kurstitel-muessen-eindeutig-sein'],
    ['Größe & Übersicht', 'groesse-uebersicht'],
    ['Café (online)!', 'cafe-online'],
  ])('%s → %s', (text, id) => {
    expect(headingId(text)).toBe(id);
  });
});

describe('manualHref', () => {
  it('maps the start page to /help and other slugs below it', () => {
    expect(manualHref('')).toBe('/help');
    expect(manualHref('organizers/sessions')).toBe('/help/organizers/sessions');
  });
});

describe('resolveManualLink', () => {
  it.each([
    ['sessions.md', 'organizers/course-setup', '/help/organizers/sessions'],
    ['assistant.md#what-it-can-do', 'organizers/sessions', '/help/organizers/assistant#what-it-can-do'],
    ['../participants/registration.md', 'organizers/registrations', '/help/participants/registration'],
    ['participants/registration.md', '', '/help/participants/registration'],
    ['course-setup.md', 'organizers', '/help/organizers/course-setup'],
    ['../index.md', 'organizers/sessions', '/help'],
    ['index.md', 'organizers/sessions', '/help/organizers'],
  ])('%s from %s → %s', (href, slug, expected) => {
    expect(resolveManualLink(href, slug)).toBe(expected);
  });

  it.each(['https://example.org/a.md', 'mailto:help@example.org', '/profile', '#anchor', 'image.png'])(
    'leaves %s unchanged',
    (href) => {
      expect(resolveManualLink(href, 'organizers/sessions')).toBe(href);
    }
  );
});
