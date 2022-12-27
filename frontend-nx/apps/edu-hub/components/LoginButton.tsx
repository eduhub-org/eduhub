import { signIn } from "next-auth/react";
import { FC } from "react";
import useTranslation from 'next-translate/useTranslation';
import { Button } from "./common/Button";

const signInHandler = () => {
  console.log("signIN!");
  return signIn("keycloak")
};

export const LoginButton: FC = () => {
  const { t } = useTranslation("common");

  console.log("test");

  return <Button onClick={signInHandler}>{t("loginButton")}</Button>;
};
