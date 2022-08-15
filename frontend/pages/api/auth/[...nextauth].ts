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
      clientSecret: "WWzGeFLQdDQZmVUaiJJwJuV5HrbXGEKc",
      authorization: `${process.env.NEXT_PUBLIC_AUTH_URL}/auth`,
      issuer: `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub`,
    }),
  ],
  callbacks: {
    jwt: async ({ token, account, user, profile }) => {
      // Persist the OAuth access_token to the token right after signin
      if (account && profile) {
        console.log(account, token);
        token.accessToken = account.access_token;
        token.profile = profile;
      }
      return token;
    },
    session: async ({ session, token, user }) => {
      // Send properties to the client, like an access_token from a provider.
      console.log(session, token);
      session.accessToken = token.accessToken;
      session.user = user;
      session.profile = token.profile;
      return session;
    },
  },
});
