/** Apollo context for anonymous widget GraphQL requests. */
export const WIDGET_ANONYMOUS_CONTEXT = {
  headers: { 'x-hasura-role': 'anonymous' },
} as const;

/** Parse comma-separated course group option ids from the `groups` query param. */
export const parseWidgetGroupIds = (groups: string | string[] | undefined): number[] => {
  if (!groups) return [];
  const raw = Array.isArray(groups) ? groups.join(',') : groups;
  return raw
    .split(',')
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => !isNaN(value));
};
