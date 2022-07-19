import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useIsLoggedIn } from "../hooks/authentication";
import { Button } from "./common/Button";

export const useLogin = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();
  const performLogin = useCallback(() => {
    const url = keycloak?.createLoginUrl({
      redirectUri: window.location.href,
    });
    if (!url) return;

    router.push(new URL(url));
  }, [keycloak, router]);

  return performLogin;
};

export const useLogout = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();
  const logout = useCallback(() => {
    const url = keycloak?.createLogoutUrl({
      redirectUri: window.location.href,
    });

    if (!url) return;
    router.push(new URL(url));
  }, [router, keycloak]);
  return logout;
};

export const LoginButton: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const performLogin = useLogin();
  const performLogout = useLogout();

  return (
    <>
      {!isLoggedIn && <Button onClick={performLogin}>Anmelden</Button>}
      {isLoggedIn && <Button onClick={performLogout}>Abmelden</Button>}
    </>
  );
};
