import { ProjectTypeRow } from './types';

/**
 * The submission deliverables an instructor can require, in the order they are
 * shown as checkboxes. Each maps 1:1 to a `requires*` flag on `ProjectType`.
 */
export const PROJECT_REQUIREMENT_KEYS = [
  'requiresDocumentation',
  'requiresExternalUrl',
  'requiresPresentation',
  'requiresCoverImage',
] as const;

export type ProjectRequirementKey = (typeof PROJECT_REQUIREMENT_KEYS)[number];

export type ProjectRequirementFlags = Record<ProjectRequirementKey, boolean>;

/**
 * Maps each camelCase requirement flag (a `ProjectType` column name) to its
 * snake_case translation key segment under `manageCourse.projects.requirements`
 * (locale keys follow snake_case convention).
 */
export const REQUIREMENT_I18N_KEY: Record<ProjectRequirementKey, string> = {
  requiresDocumentation: 'requires_documentation',
  requiresExternalUrl: 'requires_external_url',
  requiresPresentation: 'requires_presentation',
  requiresCoverImage: 'requires_cover_image',
};

/**
 * Catalog value of the online-course project type. It shares its deliverable
 * flags with CLASSIC_PROJECT (documentation only), so the two can only be told
 * apart by an explicit choice. Used as the default when a documentation-only
 * combination is otherwise ambiguous.
 */
export const ONLINE_COURSE_TYPE_VALUE = 'ONLINE_COURSE';

/**
 * Legacy documentation-only type. New projects never store this value: a
 * classical project always requires a cover image, so it resolves to one of the
 * cover-requiring catalog types instead.
 */
export const CLASSIC_PROJECT_TYPE_VALUE = 'CLASSIC_PROJECT';

/**
 * Default deliverables for a freshly selected "classical" project. A cover image
 * is always required for classical projects and the only documentation-only type
 * (CLASSIC_PROJECT) is legacy, so the minimal valid classical project also
 * requires a presentation (resolves to PROJECT_WITH_PRESENTATION).
 */
export const DEFAULT_CLASSIC_REQUIREMENT_FLAGS: ProjectRequirementFlags = {
  requiresDocumentation: true,
  requiresExternalUrl: false,
  requiresPresentation: true,
  requiresCoverImage: true,
};

/** Reads the requirement flags off a catalog project type (defaults to all false). */
export const flagsOfProjectType = (
  projectType?: ProjectTypeRow | null
): ProjectRequirementFlags => ({
  requiresDocumentation: Boolean(projectType?.requiresDocumentation),
  requiresExternalUrl: Boolean(projectType?.requiresExternalUrl),
  requiresPresentation: Boolean(projectType?.requiresPresentation),
  requiresCoverImage: Boolean(projectType?.requiresCoverImage),
});

const flagsEqual = (a: ProjectRequirementFlags, b: ProjectRequirementFlags): boolean =>
  PROJECT_REQUIREMENT_KEYS.every((key) => a[key] === b[key]);

/** Every catalog type whose deliverable flags exactly match `requirements`. */
export const getMatchingProjectTypes = (
  projectTypes: ProjectTypeRow[],
  requirements: ProjectRequirementFlags
): ProjectTypeRow[] =>
  projectTypes.filter((pt) => flagsEqual(flagsOfProjectType(pt), requirements));

/**
 * Maps a set of checked deliverable requirements back onto the fixed catalog of
 * project types. The deliverable flags do not always uniquely identify a type
 * (e.g. ONLINE_COURSE and CLASSIC_PROJECT both require documentation only), so
 * `preferredValues` is consulted first to keep the currently selected / program
 * default type stable. Returns null when no catalog type matches the
 * combination, which the UI surfaces as an invalid selection.
 */
export const resolveProjectTypeFromRequirements = (
  projectTypes: ProjectTypeRow[],
  requirements: ProjectRequirementFlags,
  preferredValues: string[] = []
): ProjectTypeRow | null => {
  const matches = getMatchingProjectTypes(projectTypes, requirements);
  if (matches.length === 0) return null;
  for (const preferred of preferredValues) {
    const preferredMatch = matches.find((pt) => pt.value === preferred);
    if (preferredMatch) return preferredMatch;
  }
  return matches[0];
};

/**
 * True for catalog types that represent a valid *new* classical project, i.e.
 * everything except the online course and the legacy documentation-only type.
 * Classical projects always require a cover image, so the cover flag is the
 * distinguishing marker.
 */
export const isClassicCatalogType = (projectType: ProjectTypeRow): boolean =>
  projectType.value !== ONLINE_COURSE_TYPE_VALUE &&
  Boolean(projectType.requiresCoverImage);

/**
 * Resolves the deliverable selection of a classical project (documentation /
 * external link / presentation) to a catalog type, forcing the always-required
 * cover image on. Returns null when no catalog type matches the combination
 * (e.g. nothing but documentation, which has no cover-requiring counterpart).
 */
export const resolveClassicProjectType = (
  projectTypes: ProjectTypeRow[],
  flags: ProjectRequirementFlags,
  preferredValues: string[] = []
): ProjectTypeRow | null =>
  resolveProjectTypeFromRequirements(
    projectTypes,
    { ...flags, requiresCoverImage: true },
    preferredValues
  );

/**
 * Picks the project type a freshly opened "add project" dialog should start on.
 * Defaults to a classical project unless the carried-over type (from the last
 * created project) is the online course. A carried classical type is kept when
 * it is still a valid cover-requiring catalog type; otherwise the baseline
 * classical type is used.
 */
export const resolveInitialProjectType = (
  carriedType: string | null | undefined,
  projectTypes: ProjectTypeRow[]
): string => {
  if (carriedType === ONLINE_COURSE_TYPE_VALUE) return ONLINE_COURSE_TYPE_VALUE;
  const carried = projectTypes.find((pt) => pt.value === carriedType);
  if (carried && isClassicCatalogType(carried)) return carried.value;
  const baseline = resolveClassicProjectType(
    projectTypes,
    DEFAULT_CLASSIC_REQUIREMENT_FLAGS
  );
  return baseline?.value ?? '';
};
