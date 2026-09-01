// Pure helpers behind the organization selector on the Courses/Degrees/Events dashboards. Kept in
// their own module so they stay unit-testable without pulling in the whole dashboard component tree.

type OrganizationScopeOption = { value: string; label: string };

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

/**
 * The organization actually in effect, or null for "all organizations". A remembered organization is
 * dropped when it owns no program of the current type — which happens routinely when switching
 * between the Courses, Degrees and Events screens — so the selector never shows a value that is not
 * among its options.
 */
export const resolveOrganizationScope = (
  storedOrganizationId: number | null,
  options: OrganizationScopeOption[]
): number | null =>
  storedOrganizationId !== null && options.some((option) => option.value === String(storedOrganizationId))
    ? storedOrganizationId
    : null;
