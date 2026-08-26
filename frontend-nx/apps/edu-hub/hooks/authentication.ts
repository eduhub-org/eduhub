import { useSession } from 'next-auth/react';
import { AuthRoles } from '../types/enums';

// Utility function to extract Hasura roles from session data
const hasRole = (sessionData: any, role: AuthRoles): boolean => (
  sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles']?.includes(role) ?? false
);

export const useIsSessionLoading = (): boolean => {
  const { status } = useSession();
  return status === "loading";
};

export const useIsLoggedIn = (): boolean => {
  const { data: sessionData, status } = useSession();
  return (status === 'authenticated') && !!sessionData?.accessToken;
};

export const useIsAdmin = (): boolean => {
  const { data: sessionData } = useSession();
  return hasRole(sessionData, AuthRoles.admin);
};

export const useIsInstructor = (): boolean => {
  const { data: sessionData } = useSession();
  return hasRole(sessionData, AuthRoles.instructor);
};

// Whether the current user administers at least one organization. Used purely for UI gating/nav.
// NOTE: org_admin is intentionally NOT part of useCurrentRole — a user who is both an instructor
// and an org admin must keep `instructor` (or `user`) as their default request role so access to
// resources from other organizations (granted via the instructor path) is not lost. The org_admin
// role is only ever applied explicitly via useOrgAdminQuery / useOrgAdminMutation.
export const useIsOrgAdmin = (): boolean => {
  const { data: sessionData } = useSession();
  return hasRole(sessionData, AuthRoles.org_admin);
};

// The Hasura user id of the signed-in user (the Keycloak `sub`, mapped onto the
// x-hasura-user-id claim), or null while signed out. Single source for the claim path.
export const useCurrentUserId = (): string | null => {
  const { data: sessionData } = useSession();
  return sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] ?? null;
};

export const useIsUserIdInList = (allowedIds: string[]): boolean => {
  const userId = useCurrentUserId();
  return Boolean(userId && allowedIds?.includes(userId));
};

export const useIsUser = (): boolean => {
  const { data: sessionData } = useSession();
  return hasRole(sessionData, AuthRoles.user);
};

export const useCurrentRole = (): AuthRoles => {
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const isUser = useIsUser();

  switch (true) {
    case isAdmin:
      return AuthRoles.admin;
    case isInstructor:
      return AuthRoles.instructor;
    case isUser:
      return AuthRoles.user;
    default:
      return AuthRoles.anonymous;
  }
};

// The role to use for the organization-management screens (manage programs/courses/admin-users).
// Super-admins keep the `admin` role (full, unscoped access); everyone else who reaches these
// screens is an org admin and uses `org_admin` (tenant-scoped in Hasura). This is deliberately NOT
// folded into useCurrentRole — see the note on useIsOrgAdmin — so it must be requested explicitly
// via useManageQuery / useManageMutation (or by passing it as the `role` of a shared component).
export const useManageRole = (): AuthRoles => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();

  switch (true) {
    case isAdmin:
      return AuthRoles.admin;
    case isOrgAdmin:
      return AuthRoles.org_admin;
    default:
      return AuthRoles.user;
  }
};
