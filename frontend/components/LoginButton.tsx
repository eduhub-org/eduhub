import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const LoginButton: FC = () => {
  const { t } = useTranslation();
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  return (
    <div
      className="flex cursor-pointer"
      onClick={() => {
        console.log("R", window.location.href);
        const url = keycloak?.createLoginUrl({
          redirectUri: window.location.href,
        });
        console.log("url", url);

        if (!url) return;
        router.push(new URL(url));
      }}
    >
      <Button>{t("loginButton.title")}</Button>
    </div>
  );
};
