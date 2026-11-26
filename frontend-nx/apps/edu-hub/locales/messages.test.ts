import de from './de.json';
import en from './en.json';
import allowlist from './programTypeWordingAllowlist.json';

/** Messages that still name one program type, per locale — see the file's own comment. */
const ALLOWED_PROGRAM_TYPE_WORDING: Record<string, Set<string>> = {
  de: new Set(allowlist.de),
  en: new Set(allowlist.en),
};

type MessageTree = { [key: string]: string | MessageTree };

const LOCALES: Array<[string, MessageTree]> = [
  ['de', de as unknown as MessageTree],
  ['en', en as unknown as MessageTree],
];

const flatten = (tree: MessageTree, prefix = ''): Array<[string, string]> =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [[path, value] as [string, string]] : flatten(value, path);
  });

const resolve = (tree: MessageTree, path: string): string | MessageTree | undefined =>
  path.split('.').reduce<string | MessageTree | undefined>((node, part) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return node[part];
  }, tree);

describe.each(LOCALES)('%s.json', (_locale, messages) => {
  // In ICU message syntax an apostrophe directly in front of a placeholder escapes it, so
  // "the course '{title}'" renders the literal text {title} instead of the course title.
  it('does not escape placeholders with an apostrophe', () => {
    const escaped = flatten(messages)
      .filter(([, message]) => message.includes("'{"))
      .map(([path]) => path);

    expect(escaped).toEqual([]);
  });
});

// A key may carry per-program-type overrides as `<key>.{courses,events,degrees}`; the
// translator in hooks/useProgramTypeTranslations.ts picks the one matching the program
// type and otherwise falls back to the key itself. Two things have to hold for that to
// be safe, and both are checked below.
describe.each(LOCALES)('program-type wording in %s.json', (locale, messages) => {
  const PROGRAM_TYPES = ['courses', 'events', 'degrees'];
  const COURSE_NAMESPACES = ['course', 'coursePage', 'courseAdminPage', 'manageCourse', 'manageCourses'];

  /**
   * Override sets: groups whose keys are only program types and the neutral `other`.
   * A group that merely happens to contain a message called `events` (e.g.
   * `course.general.events`, the word "Event") is ordinary nesting, not an override set.
   */
  const OVERRIDE_KEYS = [...PROGRAM_TYPES, 'other'];

  const isOverrideGroup = (group: MessageTree): boolean => {
    const keys = Object.keys(group);
    return keys.some((k) => PROGRAM_TYPES.includes(k)) && keys.every((k) => OVERRIDE_KEYS.includes(k));
  };

  const overrideGroups = (tree: MessageTree, prefix = ''): Array<[string, MessageTree]> =>
    Object.entries(tree).flatMap(([key, value]) => {
      if (typeof value === 'string') return [];
      const path = prefix ? `${prefix}.${key}` : key;
      return isOverrideGroup(value) ? [[path, value] as [string, MessageTree]] : overrideGroups(value, path);
    });

  /** Every message except those inside an override set, where the noun is deliberate. */
  const messagesOutsideOverrides = (tree: MessageTree, prefix = ''): Array<[string, string]> =>
    Object.entries(tree).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') return [[path, value] as [string, string]];
      return isOverrideGroup(value) ? [] : messagesOutsideOverrides(value, path);
    });

  // A partial override set with no base is the one shape that fails silently: a degree
  // would fall through to a key that does not exist.
  it('never leaves a partial override set without a base', () => {
    const broken = COURSE_NAMESPACES.flatMap((namespace) =>
      overrideGroups(messages[namespace] as MessageTree).flatMap(([path, group]) => {
        const present = PROGRAM_TYPES.filter((type) => typeof group[type] === 'string');
        const complete = present.length === PROGRAM_TYPES.length;
        // JSON cannot hold a string and children under one key, so the neutral
        // base sits at `other`, as in an ICU select.
        const hasBase = typeof group.other === 'string';
        return complete || hasBase ? [] : [`${namespace}.${path} (only: ${present.join(', ')})`];
      })
    );

    expect(broken).toEqual([]);
  });

  // CONTEXT.md lists "Kurs/Veranstaltung used interchangeably" under things to avoid, and
  // these namespaces all serve courses, events and degrees alike. The existing offenders are
  // listed per locale in programTypeWordingAllowlist.json; the two tests below fail for any
  // NEW one and for any entry that no longer offends, so the lists can only shrink. Clear one
  // by giving its key a neutral `other` plus the overrides that need the precise noun.
  const NAMES_ONE_TYPE = /Kurs|Veranstaltung|Studiengang|course|event|degree/i;

  const offendingKeys = (): string[] =>
    COURSE_NAMESPACES.flatMap((namespace) =>
      messagesOutsideOverrides(messages[namespace] as MessageTree)
        .filter(([, message]) => NAMES_ONE_TYPE.test(message))
        .map(([path]) => `${namespace}.${path}`)
    );

  it('adds no new message that names one program type for all three', () => {
    const allowed = ALLOWED_PROGRAM_TYPE_WORDING[locale];

    expect(offendingKeys().filter((key) => !allowed.has(key))).toEqual([]);
  });

  it('spots wording for any of the three types, not just German and course', () => {
    expect(NAMES_ONE_TYPE.test('Cancel event')).toBe(true);
    expect(NAMES_ONE_TYPE.test('Cancel degree')).toBe(true);
    expect(NAMES_ONE_TYPE.test('Kurs abbrechen')).toBe(true);
    expect(NAMES_ONE_TYPE.test('Teilnahme absagen')).toBe(false);
  });

  // The exemption follows the group's structure, so a message that merely happens to be
  // called `events` -- e.g. course.general.events, the word "Event" -- stays checked.
  it('exempts override sets but not an ordinary message named after a type', () => {
    const tree: MessageTree = {
      real_override: { courses: 'Kurs', events: 'Event', degrees: 'Degree' },
      ordinary: { events: 'Event', save: 'Speichern' },
    };

    expect(messagesOutsideOverrides(tree).map(([path]) => path).sort()).toEqual([
      'ordinary.events',
      'ordinary.save',
    ]);
  });

  it('keeps no allowlist entry that has already been fixed', () => {
    const allowed = ALLOWED_PROGRAM_TYPE_WORDING[locale];
    const stillOffending = new Set(offendingKeys());

    expect([...allowed].filter((key) => !stillOffending.has(key))).toEqual([]);
  });
});

// The manage courses/events/degrees pages share ManageCoursesContent and select the wording
// variant matching their program type, so every variant has to exist in both locales.
describe.each(LOCALES)('manageCourses messages in %s.json', (_locale, messages) => {
  const PROGRAM_TYPES = ['courses', 'events', 'degrees'];

  const PROGRAM_TYPE_AWARE_KEYS = [
    'table_header.has_custom_templates',
    'default_title',
    'delete_button.delete_confirmation',
    'empty_state',
    'create_first_program',
    'copy_to_program_dialog.title',
    'copy_to_program_dialog.description',
    'copy_to_program_dialog.button',
    'notifications.added_success',
    'notifications.add_failed',
    'notifications.published_success_singular',
    'notifications.published_success_plural',
    'notifications.unpublished_success_singular',
    'notifications.unpublished_success_plural',
    'notifications.bulk_action_failed',
    'notifications.copied_success_singular',
    'notifications.copied_success_plural',
  ];

  it.each(PROGRAM_TYPE_AWARE_KEYS)('has one %s variant per program type', (key) => {
    const group = resolve(messages.manageCourses as MessageTree, key);

    expect(group).toBeDefined();
    expect(Object.keys(group as MessageTree).sort()).toEqual([...PROGRAM_TYPES].sort());
    for (const programType of PROGRAM_TYPES) {
      expect(typeof (group as MessageTree)[programType]).toBe('string');
    }
  });

  it.each(PROGRAM_TYPES)('keeps the title placeholder in the %s deletion confirmation', (programType) => {
    const group = resolve(messages.manageCourses as MessageTree, 'delete_button.delete_confirmation') as MessageTree;

    expect(group[programType]).toContain('{title}');
  });

  it.each(PROGRAM_TYPES)('keeps count and program placeholders in the %s copy notification', (programType) => {
    const group = resolve(messages.manageCourses as MessageTree, 'notifications.copied_success_plural') as MessageTree;

    expect(group[programType]).toContain('{count}');
    expect(group[programType]).toContain('{programTitle}');
  });
});
