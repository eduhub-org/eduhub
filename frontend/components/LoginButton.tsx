import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance, KeycloakTokenParsed } from "keycloak-js";
import { useRouter } from "next/router";
import { FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gql, useMutation } from '@apollo/client';
import { Button } from "./common/Button";
type ParsedToken = KeycloakTokenParsed & {
  email?: string
  first_name?: string
  last_name?: string
}
const UPDATE_USER = gql`
  mutation update_User($id: ID!, $email: String!, $firstName: String!, $lastName: String!) {
    update_User(where: {id: {_eq: $id}}, _set: {email: $email, firstName: $firstName, lastName: $lastName}) {
      affected_rows
    }
  }
`;
export const useLogin = () => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();
  const performLogin = useCallback(() => {
    const url = keycloak?.createLoginUrl({
      redirectUri: window.location.href + "?from_keycloak=true",
    });
    if (!url) return;
    
    router.push(new URL(url));
  }, [keycloak, router]);
  
  return performLogin;
};
export const LoginButton: FC = () => {
  const { t } = useTranslation();
  const performLogin = useLogin();

  const { keycloak } = useKeycloak<KeycloakInstance>();
  const [updateUser, { data, error }] = useMutation(UPDATE_USER);
  const parsedToken: ParsedToken | undefined = keycloak?.tokenParsed;
  updateUser({ variables: { id: parsedToken?.sub, email: parsedToken?.email, firstName: parsedToken?.first_name, lastName: parsedToken?.last_name } });
  return <Button onClick={performLogin}>{t("loginButton.title")}</Button>;
};
