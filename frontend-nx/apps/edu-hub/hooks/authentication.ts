import { useSession } from 'next-auth/react';

export const useIsLoggedIn = (): boolean => {
  const { data: sessionData, status } = useSession();

  return (status === 'authenticated' || false) && !!sessionData?.accessToken;
};

export const useIsAdmin = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes('admin') ?? false
  );
};

export const useIsInstructor = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes('instructor') ?? false
  );
};

export const useIsUser = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.[
      'x-hasura-allowed-roles'
    ]?.includes('user') ?? false
  );
};

export const useCurrentRole = () => {
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const isUser = useIsUser();

  switch (true) {
    case isAdmin:
      return 'admin';

    case isInstructor:
      return 'instructor';

    case isUser:
      return 'user';

    default:
      return '';
  }
};
