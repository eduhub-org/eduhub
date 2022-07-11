import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";

export const OnlyLoggedIn: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const { keycloak } = useKeycloak<KeycloakInstance>();

  // console.log(keycloak);

  const token = keycloak?.token;

  if (!isLoggedIn || !token) return null;

  return <>{children}</>;
};

export const OnlyNotAdmin: FC = ({ children }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  if (!keycloak?.resourceAccess?.hasura?.roles?.includes("admin")) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const OnlyNotInstructor: FC = ({ children }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  if (
    keycloak?.resourceAccess?.hasura?.roles?.includes("instructor_access") ||
    keycloak?.resourceAccess?.hasura?.roles?.includes("admin")
  ) {
    return null;
  } else {
    return <>{children}</>;
  }
};

export const OnlyAdmin: FC = ({ children }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  if (keycloak?.resourceAccess?.hasura?.roles?.includes("admin")) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const OnlyInstructor: FC = ({ children }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  if (
    keycloak?.resourceAccess?.hasura?.roles?.includes("instructor_access") ||
    keycloak?.resourceAccess?.hasura?.roles?.includes("admin")
  ) {
    return <>{children}</>;
  } else {
    return null;
  }
};
