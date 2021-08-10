import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

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

export const LoginButton: FC = () => {
  const { t } = useTranslation();

  const performLogin = useLogin();

  return <Button onClick={performLogin}>{t("loginButton.title")}</Button>;
};
