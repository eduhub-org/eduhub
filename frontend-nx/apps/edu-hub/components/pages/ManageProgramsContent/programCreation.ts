import { ProgramType } from '../../../types/enums';

// Pure helpers behind CreateProgramDialog, kept apart so they stay unit-testable.

export type ProgramCreationGrant = {
  organizationId: number;
  Organization: { id: number; name: string } | null;
  canManageCourses: boolean;
  canManageEvents: boolean;
  canManageDegrees: boolean;
  canManageSettings: boolean;
};

export type OrganizationOption = { value: string; label: string };

/**
 * Whether an OrganizationAdmin grant may create a program of the given type. Mirrors the Hasura
 * org_admin_access insert check on Program: the per-type capability, or canManageSettings for any type.
 */
export const grantAllowsProgramType = (grant: ProgramCreationGrant, programType: ProgramType): boolean => {
  if (grant.canManageSettings) return true;
  switch (programType) {
    case ProgramType.EVENTS:
      return grant.canManageEvents;
    case ProgramType.DEGREES:
      return grant.canManageDegrees;
    default:
      return grant.canManageCourses;
  }
};

/** Organizations an org admin may create a program of the given type for, sorted by name. */
export const creatableOrganizations = (
  grants: ProgramCreationGrant[],
  programType: ProgramType
): OrganizationOption[] => {
  const byId = new Map<number, string>();
  grants
    .filter((grant) => grantAllowsProgramType(grant, programType))
    .forEach((grant) => byId.set(grant.organizationId, grant.Organization?.name ?? String(grant.organizationId)));
  return Array.from(byId, ([id, name]) => ({ value: String(id), label: name })).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

/** Program types an org admin may create a program of in at least one organization. */
export const creatableProgramTypes = (grants: ProgramCreationGrant[]): ProgramType[] =>
  [ProgramType.COURSES, ProgramType.EVENTS, ProgramType.DEGREES].filter((type) =>
    grants.some((grant) => grantAllowsProgramType(grant, type))
  );
