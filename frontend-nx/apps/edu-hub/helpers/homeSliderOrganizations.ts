/** Organization id of the platform default organization ("EduHub Default"). */
export const DEFAULT_ORGANIZATION_ID = 0;

/**
 * Ids of the organizations whose programs fill the automatic homepage sliders and the public event
 * feeds: the default organization plus those a super-admin added. Compared by value, never by
 * truthiness, since the default organization's id is 0.
 */
export const includedOrganizationIds = (rows: { organizationId: number }[] | null | undefined): number[] => [
  DEFAULT_ORGANIZATION_ID,
  ...(rows ?? []).map((row) => row.organizationId).filter((id) => id !== DEFAULT_ORGANIZATION_ID),
];

/** Courses whose program belongs to one of the included organizations. */
export const filterByIncludedOrganizations = <T extends { Program?: { organizationId?: number | null } | null }>(
  courses: T[],
  organizationIds: number[]
): T[] => {
  const included = new Set(organizationIds);
  return courses.filter((course) => {
    const organizationId = course.Program?.organizationId;
    return organizationId != null && included.has(organizationId);
  });
};
