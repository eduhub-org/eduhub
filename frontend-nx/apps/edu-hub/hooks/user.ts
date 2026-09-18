import { useSession } from 'next-auth/react';

import { User } from '../queries/__generated__/User';
import { USER } from '../queries/user';

import { useAuthedQuery } from './authedQuery';
import { useViewAs } from './viewAs';

/**
 * The user the UI is acting for. While a super-admin impersonates someone this
 * is the impersonated user, so every consumer - and useUser() below with it -
 * follows without a change of its own.
 */
export const useUserId = () => {
  const { userId: viewedUserId } = useViewAs();
  const { data } = useSession();
  if (viewedUserId) return viewedUserId;

  return data?.profile?.sub;
};
export const useUser = () => {
  // Keyed on useUserId rather than on the session directly, so the profile the
  // app shows is the profile of whoever it is currently acting for.
  const userId = useUserId();

  const { data } = useAuthedQuery<User>(USER, {
    variables: {
      userId,
    },
    skip: !userId,
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
