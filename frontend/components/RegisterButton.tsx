import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const RegisterButton: FC = () => {
  const { t } = useTranslation();
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  return (
    <div
      className="flex cursor-pointer"
      onClick={() => {
        const url = keycloak?.createRegisterUrl({
          redirectUri: "http://localhost:3000/",
        });
        console.log("url", url);

        if (!url) return;
        router.push(new URL(url));
      }}
    >
      <Button filled>{t("registerButton.title")}</Button>
    </div>
  );

  // return (
  //   <Link href="/register">
  //     <a className="flex">
  //       <Button filled>{t("registerButton.title")}</Button>
  //     </a>
  //   </Link>
  // );
};
