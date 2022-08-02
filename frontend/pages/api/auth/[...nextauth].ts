import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";
import type { Account, Awaitable, Session, User } from "next-auth/core/types";

interface JWTData {
  token: JWT;
  user?: User;
  account?: Account;
}

interface SessionData {
  session: Session;
  token: JWT;
  user?: User;
}

interface LogoutMessage {
  session: Session;
  token: JWT;
}

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: "hasura",
      clientSecret: "OvxfdDXRVRVVS7MLkkM8cgr41ilPPE8J",
      authorization: `${process.env.NEXT_PUBLIC_AUTH_URL}/auth`,
      issuer: `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub`,
    }),
  ],
});
