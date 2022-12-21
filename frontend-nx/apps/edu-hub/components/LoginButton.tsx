import { signIn } from "next-auth/react";
import { FC } from "react";
import useTranslation from 'next-translate/useTranslation';
import { Button } from "./common/Button";

const signInHandler = () => signIn("keycloak");

export const LoginButton: FC = () => {
  const { t } = useTranslation("common");

  return <Button onClick={signInHandler}>{t("loginButton")}</Button>;
};
