import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance, KeycloakTokenParsed } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gql, useMutation } from '@apollo/client';
import { Button } from "./common/Button";

const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id)
  }
`;

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
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const [updateUser, { data, error }] = useMutation(UPDATE_USER);

  useEffect(() => {
    if (keycloak !== undefined) {
      keycloak.onAuthSuccess = () => {
        const parsedToken: KeycloakTokenParsed | undefined = keycloak?.tokenParsed;

        updateUser({ variables: { id: parsedToken?.sub} });
      }
    }
  },[]); 

  const { t } = useTranslation();
  const performLogin = useLogin();

  return <Button onClick={performLogin}>{t("loginButton.title")}</Button>;
};
