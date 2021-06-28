import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";

export const OnlyLoggedIn: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  if (!isLoggedIn || !token) return null;

  return <>{children}</>;
};
