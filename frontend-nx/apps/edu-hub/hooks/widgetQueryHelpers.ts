/** Apollo context for anonymous widget GraphQL requests. */
export const WIDGET_ANONYMOUS_CONTEXT = {
  headers: { 'x-hasura-role': 'anonymous' },
} as const;

/**
 * Parse course group option ids from the widget query params: `groups` takes a
 * comma-separated list, `group` a single id. Both are merged, so `group=7` and
 * `groups=7` select the same CourseGroupOption (by id, not by its slider order).
 */
export const parseWidgetGroupIds = (
  groups: string | string[] | undefined,
  group?: string | string[] | undefined
): number[] => {
  const raw = [groups, group]
    .flat()
    .filter((value): value is string => Boolean(value))
    .join(',');
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => !isNaN(value));
  return Array.from(new Set(ids));
};
