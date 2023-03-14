import { useSession } from 'next-auth/react';

import { AuthRoles } from '../types/enums';

export const useIsLoggedIn = (): boolean => {
  const { data: sessionData, status } = useSession();

  return (status === 'authenticated' || false) && !!sessionData?.accessToken;
};

export const useIsAdmin = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes(AuthRoles.admin) ?? false
  );
};

export const useIsInstructor = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes(AuthRoles.instructor) ?? false
  );
};

export const useIsUser = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes(AuthRoles.user) ?? false
  );
};

export const useCurrentRole = () => {
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
