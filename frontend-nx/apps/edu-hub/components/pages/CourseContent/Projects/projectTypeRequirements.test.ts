import { ProjectTypeRow } from './types';
import {
  DEFAULT_CLASSIC_REQUIREMENT_FLAGS,
  ProjectRequirementFlags,
  isClassicCatalogType,
  resolveClassicProjectType,
  resolveInitialProjectType,
} from './projectTypeRequirements';

const type = (
  value: string,
  requiresDocumentation: boolean,
  requiresPresentation: boolean,
  requiresExternalUrl: boolean,
  requiresCoverImage: boolean
): ProjectTypeRow =>
  ({
    value,
    requiresDocumentation,
    requiresPresentation,
    requiresExternalUrl,
    requiresCoverImage,
  } as unknown as ProjectTypeRow);

/** The full catalog after the documentation-only classical type was added. */
const CATALOG: ProjectTypeRow[] = [
  type('ONLINE_COURSE', true, false, false, false),
  type('CLASSIC_PROJECT', true, false, false, false),
  type('PROJECT_WITH_DOCUMENTATION_ONLY', true, false, false, true),
  type('PROJECT_WITH_LINK', true, false, true, true),
  type('PROJECT_WITH_PRESENTATION', true, true, false, true),
  type('PROJECT_WITH_LINK_AND_PRESENTATION', true, true, true, true),
  type('PRESENTATION_WITHOUT_DOCUMENTATION', false, true, false, true),
  type('PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION', false, true, true, true),
];

/** The three deliverables the classical picker actually exposes as checkboxes. */
const flags = (
  requiresDocumentation: boolean,
  requiresExternalUrl: boolean,
  requiresPresentation: boolean
): ProjectRequirementFlags => ({
  requiresDocumentation,
  requiresExternalUrl,
  requiresPresentation,
  // Forced on by resolveClassicProjectType; the picker has no cover checkbox.
  requiresCoverImage: false,
});

describe('resolveClassicProjectType', () => {
  it('maps documentation alone onto the documentation-only classical type', () => {
    expect(resolveClassicProjectType(CATALOG, flags(true, false, false))?.value).toBe(
      'PROJECT_WITH_DOCUMENTATION_ONLY'
    );
  });

  it('never falls back to the legacy cover-less CLASSIC_PROJECT, even when preferred', () => {
    expect(
      resolveClassicProjectType(CATALOG, flags(true, false, false), [
        'CLASSIC_PROJECT',
      ])?.value
    ).toBe('PROJECT_WITH_DOCUMENTATION_ONLY');
  });

  it('keeps the existing deliverable combinations on their types', () => {
    expect(resolveClassicProjectType(CATALOG, flags(true, true, false))?.value).toBe(
      'PROJECT_WITH_LINK'
    );
    expect(resolveClassicProjectType(CATALOG, flags(true, false, true))?.value).toBe(
      'PROJECT_WITH_PRESENTATION'
    );
    expect(resolveClassicProjectType(CATALOG, flags(true, true, true))?.value).toBe(
      'PROJECT_WITH_LINK_AND_PRESENTATION'
    );
    expect(resolveClassicProjectType(CATALOG, flags(false, false, true))?.value).toBe(
      'PRESENTATION_WITHOUT_DOCUMENTATION'
    );
    expect(resolveClassicProjectType(CATALOG, flags(false, true, true))?.value).toBe(
      'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION'
    );
  });

  it('rejects the two combinations that match no catalog type', () => {
    expect(resolveClassicProjectType(CATALOG, flags(false, false, false))).toBeNull();
    expect(resolveClassicProjectType(CATALOG, flags(false, true, false))).toBeNull();
  });

  it('keeps documentation + presentation as the dialog default', () => {
    expect(
      resolveClassicProjectType(CATALOG, DEFAULT_CLASSIC_REQUIREMENT_FLAGS)?.value
    ).toBe('PROJECT_WITH_PRESENTATION');
  });
});

describe('isClassicCatalogType', () => {
  it('accepts the documentation-only classical type', () => {
    expect(
      isClassicCatalogType(type('PROJECT_WITH_DOCUMENTATION_ONLY', true, false, false, true))
    ).toBe(true);
  });

  it('rejects the online course and the legacy documentation-only type', () => {
    expect(isClassicCatalogType(type('ONLINE_COURSE', true, false, false, false))).toBe(false);
    expect(isClassicCatalogType(type('CLASSIC_PROJECT', true, false, false, false))).toBe(false);
  });
});

describe('resolveInitialProjectType', () => {
  it('keeps the online course and any selectable classical type', () => {
    expect(resolveInitialProjectType('ONLINE_COURSE', CATALOG)).toBe('ONLINE_COURSE');
    expect(resolveInitialProjectType('PROJECT_WITH_DOCUMENTATION_ONLY', CATALOG)).toBe(
      'PROJECT_WITH_DOCUMENTATION_ONLY'
    );
  });

  it('falls back to the baseline for the legacy type and for no carried type', () => {
    expect(resolveInitialProjectType('CLASSIC_PROJECT', CATALOG)).toBe(
      'PROJECT_WITH_PRESENTATION'
    );
    expect(resolveInitialProjectType(null, CATALOG)).toBe('PROJECT_WITH_PRESENTATION');
  });
});
