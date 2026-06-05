// Course group option titles that ship with a translation under
// `common.course_group_options.*`. Custom, admin-created options use their raw
// title as the display label (there is no translation for them).
export const KNOWN_COURSE_GROUP_OPTION_TITLES = new Set<string>([
  'tech_coding',
  'business_startup',
  'creative_social_sustainable',
  'degree',
  'event',
  'courses',
]);

export const isKnownCourseGroupOptionTitle = (title?: string | null): boolean =>
  !!title && KNOWN_COURSE_GROUP_OPTION_TITLES.has(title);
