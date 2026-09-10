import de from './de.json';
import en from './en.json';

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

// The manage courses/events/degrees pages share ManageCoursesContent and select the wording
// variant matching their program type, so every variant has to exist in both locales.
describe.each(LOCALES)('manageCourses messages in %s.json', (_locale, messages) => {
  const PROGRAM_TYPES = ['courses', 'events', 'degrees'];

  const PROGRAM_TYPE_AWARE_KEYS = [
    'table_header.has_custom_templates',
    'default_title',
    'delete_button.delete_confirmation',
    'empty_state',
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
