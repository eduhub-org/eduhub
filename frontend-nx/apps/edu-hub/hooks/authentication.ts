import { useSession } from 'next-auth/react';
import { AuthRoles } from '../types/enums';

export const useIsSessionLoading = (): boolean => {
  const { status } = useSession();
  return status === "loading";
};

export const useIsLoggedIn = (): boolean => {
  const { data: session, status } = useSession();
  return status === 'authenticated' && !!session?.accessToken;
};

export const useCurrentRole = (): AuthRoles => {
  const { data: session } = useSession();
  const roles = session?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles'] || [];
  if (roles.includes(AuthRoles.admin)) return AuthRoles.admin;
  if (roles.includes(AuthRoles.instructor)) return AuthRoles.instructor;
  if (roles.includes(AuthRoles.user)) return AuthRoles.user;
  return AuthRoles.anonymous;
};

export const useIsAdmin = (): boolean => {
  const currentRole = useCurrentRole();
  return currentRole === AuthRoles.admin;
};

export const useIsInstructor = (): boolean => {
  const currentRole = useCurrentRole();
  return currentRole === AuthRoles.instructor;
};

export const useIsUser = (): boolean => {
  const currentRole = useCurrentRole();
  return currentRole === AuthRoles.user;
};
