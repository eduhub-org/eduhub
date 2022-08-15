import { useSession } from "next-auth/react";
import { useState } from "react";

import { User } from "../queries/__generated__/User";
import { USER } from "../queries/user";

import { useAuthedQuery } from "./authedQuery";

export const useUserId = () => {
  const { data: sessionData } = useSession();
  const profile = sessionData?.profile;

  return profile?.sub;
};
export const useUser = () => {
  const { data: sessionData } = useSession();
  const profile = sessionData?.profile;

  const { data, loading, error } = useAuthedQuery<User>(USER, {
    variables: {
      userId: profile?.subject,
    },
    skip: sessionData?.status !== "authenticated",
  });

  if (data?.User_by_pk) {
    return data.User_by_pk;
  } else {
    return undefined;
  }
};

interface IUserProfile {
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  username: string | undefined;
  emailVerified: boolean;
}

export const useKeycloakUserProfile = (): IUserProfile | undefined => {
  const { data: sessionData } = useSession();
  const keycloakProfile = sessionData?.profile;
  const [profile, setProfile] = useState<IUserProfile>();

  // if (!profile) {
  //   keycloak?.loadUserProfile?.().then((data) => {
  //     setProfile({
  //       email: data.email,
  //       firstName: data.firstName,
  //       lastName: data.lastName,
  //       username: data.username,
  //       emailVerified: data.emailVerified ?? false,
  //     });
  //   });
  // }

  if (!profile) {
    setProfile({
      email: keycloakProfile.email,
      firstName: keycloakProfile.firstName,
      lastName: keycloakProfile.lastName,
      username: keycloakProfile.username,
      emailVerified: keycloakProfile.emailVerified ?? false,
    });
  }

  return profile;
};
