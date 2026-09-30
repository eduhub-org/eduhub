// Pure helpers behind the organization selector on the Courses/Degrees/Events dashboards. Kept in
// their own module so they stay unit-testable without pulling in the whole dashboard component tree.

type OrganizationScopeOption = { value: string; label: string };

/** Organization id of the platform default organization ("EduHub Default"). */
export const DEFAULT_ORGANIZATION_ID = 0;

/** Stored scope: an organization id, or null when nothing was chosen yet. */
export type StoredOrganizationScope = number | null;

/**
 * The organizations that own at least one of the given programs, as dropdown options sorted by name.
 * Deriving them from the programs themselves means picking one never lands on an empty program list.
 */
export const organizationScopeOptions = (
  programs: { Organization: { id: number; name: string } }[]
): OrganizationScopeOption[] => {
  const byId = new Map<number, string>();
  programs.forEach((program) => {
    byId.set(program.Organization.id, program.Organization.name);
  });
  return Array.from(byId, ([id, name]) => ({ value: String(id), label: name })).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

const hasOption = (options: OrganizationScopeOption[], organizationId: number | null | undefined) =>
  organizationId !== null &&
  organizationId !== undefined &&
  options.some((option) => option.value === String(organizationId));

/**
 * The organization selected when nothing (valid) was chosen: the default organization if the admin
 * can see it, otherwise the organization the admin was first granted, otherwise the first option.
 * Null only when there are no options at all.
 */
export const defaultOrganizationScope = (
  options: OrganizationScopeOption[],
  initialOrganizationId: number | null = null
): number | null => {
  if (hasOption(options, DEFAULT_ORGANIZATION_ID)) {
    return DEFAULT_ORGANIZATION_ID;
  }
  if (hasOption(options, initialOrganizationId)) {
    return initialOrganizationId;
  }
  return options.length > 0 ? Number(options[0].value) : null;
};

/**
 * The organization actually in effect, or null when there are no options. A remembered organization is dropped when it owns no program of the current
 * type — which happens routinely when switching between the Courses, Degrees and Events screens —
 * so the selector never shows a value that is not among its options.
 */
export const resolveOrganizationScope = (
  stored: StoredOrganizationScope,
  options: OrganizationScopeOption[],
  { initialOrganizationId = null }: { initialOrganizationId?: number | null } = {}
): number | null => {
  if (typeof stored === 'number' && hasOption(options, stored)) {
    return stored;
  }
  return defaultOrganizationScope(options, initialOrganizationId);
};

/** Remembered program tab: a program id, or "all" for the "All programs" tab. */
export type StoredProgramTab = number | 'all';

/** Key of the remembered program tab within the per-browser map, one per program type and organization. */
export const programTabStorageKey = (programType: string, organizationId: number | null): string =>
  `${programType}:${organizationId ?? 'all'}`;

/**
 * The tab to select: the remembered one if it is still among the visible tabs (a program may have
 * been deleted or dropped out of the most recent ones), otherwise the fallback.
 */
export const resolveProgramTab = (
  stored: StoredProgramTab | null | undefined,
  tabIds: number[],
  allTabId: number,
  fallbackId: number | undefined
): number | undefined => {
  if (stored === 'all') {
    return tabIds.includes(allTabId) ? allTabId : fallbackId;
  }
  return typeof stored === 'number' && tabIds.includes(stored) ? stored : fallbackId;
};
