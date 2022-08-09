import { gql, useMutation } from "@apollo/client";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance, KeycloakTokenParsed } from "keycloak-js";
import { useEffect } from "react";

const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id)
  }
`;

export const useIsLoggedIn = (): boolean => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const [updateUser, { data, error }] = useMutation(UPDATE_USER);

  useEffect(() => {
    if (keycloak !== undefined) {
      keycloak.onAuthSuccess = () => {
        const parsedToken: KeycloakTokenParsed | undefined =
          keycloak?.tokenParsed;
        console.log("call updateUser backend function", parsedToken?.sub);
        updateUser({ variables: { id: parsedToken?.sub } });
      };
    }
  }, [keycloak, updateUser]);

  const token = keycloak?.token;

  return (!!keycloak?.authenticated ?? false) && !!token;
};

export const useIsAdmin = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  return keycloak?.resourceAccess?.hasura?.roles?.includes("admin") ?? false;
};

export const useIsInstructor = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  return (
    keycloak?.resourceAccess?.hasura?.roles?.includes("instructor") ??
    false
  );
};

export const useIsUser = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  return (
    keycloak?.resourceAccess?.hasura?.roles?.includes("user") ?? false
  );
};
