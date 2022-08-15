import { getSession, useSession } from "next-auth/react";
import { KeycloakInstance } from "keycloak-js";

export const useIsLoggedIn = (): boolean => {
  const { data: token, status } = useSession();

  return (status === "authenticated" || false) && !!token?.accessToken;
};

export const useIsAdmin = () => {
  // return keycloak?.resourceAccess?.hasura?.roles?.includes("admin") ?? false;
  return true;
};

export const useIsInstructor = () => {
  // return (
  //   keycloak?.resourceAccess?.hasura?.roles?.includes("instructor_access") ??
  //   false
  // );
  return true;
};

export const useIsUser = () => {
  // return (
  //   keycloak?.resourceAccess?.hasura?.roles?.includes("user_access") ?? false
  // );
  return true;
};
