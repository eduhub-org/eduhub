import { signIn } from "next-auth/react";
import { KeycloakInstance, KeycloakTokenParsed } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gql, useMutation } from "@apollo/client";
import { Button } from "./common/Button";

const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id)
  }
`;

export const LoginButton: FC = () => {
  // const [updateUser, { data, error }] = useMutation(UPDATE_USER);

  // useEffect(() => {
  //   if (keycloak !== undefined) {
  //     keycloak.onAuthSuccess = () => {
  //       const parsedToken: KeycloakTokenParsed | undefined =
  //         keycloak?.tokenParsed;

  //       updateUser({ variables: { id: parsedToken?.sub } });
  //     };
  //   }
  // }, []);

  const { t } = useTranslation();

  return <Button onClick={() => signIn()}>{t("loginButton.title")}</Button>;
};
