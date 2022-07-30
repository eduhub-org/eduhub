import { Button } from "@material-ui/core";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useIsLoggedIn } from "../hooks/authentication";

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

export const RegisterButton: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  const register = useCallback(() => {
    const url = keycloak?.createRegisterUrl({
      redirectUri: window.location.href,
    });

    if (!url) return;
    router.push(new URL(url));
  }, [keycloak, router]);

  return (
    <>
      {!isLoggedIn && (
        <Button variant="contained" onClick={register}>
          Registrieren
        </Button>
      )}
    </>
  );
};

export const LoginButton: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const performLogin = useLogin();
  const performLogout = useLogout();

  return (
    <>
      {!isLoggedIn && (
        <Button variant="contained" onClick={performLogin}>
          Anmelden
        </Button>
      )}
      {isLoggedIn && (
        <Button variant="contained" onClick={performLogout}>
          Abmelden
        </Button>
      )}
    </>
  );
};
