import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";

import { User } from "../queries/__generated__/User";
import { USER } from "../queries/user";

import { useAuthedQuery } from "./authedQuery";

export const useUser = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const { data, loading, error } = useAuthedQuery<User>(USER, {
    variables: {
      authId: keycloak?.subject,
    },
    skip: !keycloak?.authenticated,
  });

  if (data?.User && data?.User.length === 1) {
    return data.User[0];
  } else {
    return undefined;
  }
};
