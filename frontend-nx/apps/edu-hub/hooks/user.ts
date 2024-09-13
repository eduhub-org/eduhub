import { useSession } from 'next-auth/react';

import { User } from '../graphql/__generated__/User';
import { USER } from '../graphql/queries/user/user';

import { useAuthedQuery } from './authedQuery';

export const useUserId = () => {
  const { data } = useSession();

  return data?.profile?.sub;
};
export const useUser = () => {
  const { data: session } = useSession();

  const { data } = useAuthedQuery<User>(USER, {
    variables: {
      userId: session?.profile?.sub,
    },
    skip: !session,
  });

  if (data?.User_by_pk) {
    return data.User_by_pk;
  } else {
    return undefined;
  }
};

export interface IUserProfile {
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  username: string | undefined;
  emailVerified: boolean;
}

export const useKeycloakUserProfile = (): IUserProfile | undefined => {
  const { data: session } = useSession();

  const profile = session?.profile;

  if (!profile) return undefined;

  return {
    email: profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    username: profile.preferred_username,
    emailVerified: profile.email_verified,
  };
};
