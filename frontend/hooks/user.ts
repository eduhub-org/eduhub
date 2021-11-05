import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useState } from "react";

import { User } from "../queries/__generated__/User";
import { USER } from "../queries/user";

import { useAuthedQuery } from "./authedQuery";

export const useUserId = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  return keycloak?.subject;
};
export const useUser = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const { data, loading, error } = useAuthedQuery<User>(USER, {
    variables: {
      authId: keycloak?.subject,
    },
    skip: !keycloak?.authenticated,
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
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const [profile, setProfile] = useState<IUserProfile>();

  if (!profile) {
    keycloak?.loadUserProfile?.().then((data) => {
      setProfile({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        emailVerified: data.emailVerified ?? false,
      });
    });
  }

  return profile;
};
