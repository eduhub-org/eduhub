import { useSession } from 'next-auth/react';
import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id) {
      result
    }
  }
`;

export const useIsLoggedIn = (): boolean => {
  const { data: sessionData, status } = useSession();
  return (status === 'authenticated' || false) && !!sessionData?.accessToken;
};

export const useIsAdmin = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles']?.includes('admin-ras') ?? false
  );
};

export const useIsInstructor = () => {
  const { data: sessionData } = useSession();
  return (
    sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles']?.includes('instructor') ?? false
  );
};

export const useIsUser = () => {
  const { data: sessionData } = useSession();
  return sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles']?.includes('user') ?? false;
};
