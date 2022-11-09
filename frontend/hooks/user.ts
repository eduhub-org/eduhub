import { KeycloakInstance } from "keycloak-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { User } from "../queries/__generated__/User";
import { USER } from "../queries/user";

import { useAuthedQuery } from "./authedQuery";

export const useUserId = () => {
  const { data } = useSession();

  return data?.profile?.sub;
};
export const useUser = () => {
  const { data: session } = useSession();

  const { data, loading, error } = useAuthedQuery<User>(USER, {
    variables: {
      userId: session?.profile?.sub,
    },
    skip: !session,
  });

  if (data?.User_by_pk) {
    return data.User_by_pk;
  } else {
    return undefined;
  }
};

export interface IUserProfile {
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  username: string | undefined;
  emailVerified: boolean;
}

export const useKeycloakUserProfile = (): IUserProfile | undefined => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<IUserProfile>();
  const url = `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/account`;

  useEffect(() => {
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `bearer ${session?.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          emailVerified: data.emailVerified ?? false,
        });
      });
  });

  return profile;
};
