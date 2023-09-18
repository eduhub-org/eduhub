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

export const useIsUserIdInList = (allowedIds: string[]): boolean => {
  const { data: sessionData } = useSession();
  const userId = sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'];
  return allowedIds?.includes(userId) ?? false;
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
