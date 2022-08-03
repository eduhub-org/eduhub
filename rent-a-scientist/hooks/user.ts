import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useState } from "react";

export const useUserId = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  return keycloak?.subject;
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
