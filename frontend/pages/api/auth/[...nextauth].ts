import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";
import type { Account, Awaitable, Session, User } from "next-auth/core/types";
import { GraphQLClient, gql } from "graphql-request";

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

const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id) {
      result
    }
  }
`;

const updateUser = async (accessToken: string, userId: string) => {
  try {
    const graphQLClient = new GraphQLClient(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/graphql",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
      }
    );

    const data = await graphQLClient.request(UPDATE_USER, { id: userId });
  } catch (e) {
    console.error(e);
  }
};

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: "hasura",
      clientSecret: "OI8lPZDMKq15kcmeb5li4mFUH4qXBJxU",
      authorization: `${process.env.NEXT_PUBLIC_AUTH_URL}/auth`,
      issuer: `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub`,
      idToken: true,
    }),
  ],
  callbacks: {
    signIn: async ({ account }) => {
      if (account && account.access_token) {
        await updateUser(account.access_token, account.providerAccountId);
      }
      return true;
    },
    jwt: async ({ token, account, user, profile }) => {
      // Persist the OAuth access_token to the token right after signin
      if (account && profile) {
        // console.log(account, token);
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.profile = profile;
      }
      return token;
    },
    session: async ({ session, token, user }) => {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      session.user = user;
      session.profile = token.profile;
      return session;
    },
  },
});
