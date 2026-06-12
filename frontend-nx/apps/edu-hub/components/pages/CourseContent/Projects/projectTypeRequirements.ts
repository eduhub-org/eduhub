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
  const matches = projectTypes.filter((pt) =>
    flagsEqual(flagsOfProjectType(pt), requirements)
  );
  if (matches.length === 0) return null;
  for (const preferred of preferredValues) {
    const preferredMatch = matches.find((pt) => pt.value === preferred);
    if (preferredMatch) return preferredMatch;
  }
  return matches[0];
};
