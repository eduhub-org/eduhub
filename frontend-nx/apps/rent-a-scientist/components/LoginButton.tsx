import { Button } from "@material-ui/core";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useIsLoggedIn } from "../hooks/authentication";

export const useLogin = () => {
  const signInHandler = () => signIn("keycloak");
  return signInHandler;
};

export const useLogout = () => {
  return () => signOut();
};

export const RegisterButton: FC = () => {
  const router = useRouter();

  const register = useCallback(() => {
    const url = `${process.env.NEXT_PUBLIC_AUTH_URL
      }/realms/edu-hub/protocol/openid-connect/registrations?client_id=hasura&redirect_uri=${encodeURIComponent(
        window.location.href
      )}&response_type=code`;

    if (!url) return;
    router.push(new URL(url));
  }, [router]);

  return (
    <Button onClick={register} variant="contained">
      Registrieren
    </Button>
  );
};

export const LoginButton: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const performLogin = useLogin();
  const performLogout = useLogout();

  return (
    <>
      {!isLoggedIn && (
        <Button variant="contained" onClick={performLogin}>
          Anmelden
        </Button>
      )}
      {isLoggedIn && (
        <Button variant="contained" onClick={performLogout}>
          Abmelden
        </Button>
      )}
    </>
  );
};
