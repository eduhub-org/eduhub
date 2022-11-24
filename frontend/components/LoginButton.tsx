import { signIn } from "next-auth/react";
import { KeycloakInstance, KeycloakTokenParsed } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./common/Button";

const signInHandler = () => signIn("keycloak");

export const LoginButton: FC = () => {
  const { t } = useTranslation();

  return <Button onClick={signInHandler}>{t("loginButton.title")}</Button>;
};
