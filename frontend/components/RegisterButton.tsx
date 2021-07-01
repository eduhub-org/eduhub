import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const RegisterButton: FC = () => {
  const { t } = useTranslation();
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  const register = useCallback(() => {
    const url = keycloak?.createRegisterUrl({
      redirectUri: "http://localhost:3000/",
    });

    if (!url) return;
    router.push(new URL(url));
  }, [keycloak, router]);

  return (
    <Button filled onClick={register}>
      {t("registerButton.title")}
    </Button>
  );
};
