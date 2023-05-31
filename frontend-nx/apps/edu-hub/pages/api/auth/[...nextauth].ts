import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';

import type { JWT } from 'next-auth/jwt';
import type { IKeycloakRefreshTokenApiResponse } from './keycloakRefreshToken';

const UPDATE_USER = gql`
  mutation update_User($id: ID!) {
    updateFromKeycloak(userid: $id) {
      result
    }
  }
`;

export const updateUser = async (accessToken: string, userId: string) => {
  try {
    console.log('Trying to update user on hasura based on keycloak:', userId);
    const graphQLClient = new GraphQLClient(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1/graphql',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-hasura-role': 'user',
        },
      }
    );

    const data = await graphQLClient.request(UPDATE_USER, { id: userId });
    console.log('Update user result', data);
  } catch (e) {
    console.error(e);
  }
};

const refreshAccessToken = async (token: JWT) => {
  try {
    const refreshedTokens = await axios.post<IKeycloakRefreshTokenApiResponse>(
      `${process.env.NEXTAUTH_URL}/api/auth/keycloakRefreshToken`,
      {
        refreshToken: token?.refreshToken,
      }
    );

    if (refreshedTokens.status !== 200) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.data.access_token,
      accessTokenExpired: Date.now() + refreshedTokens.data.expires_in * 1000,
      refreshToken: refreshedTokens.data.refresh_token ?? token.refreshToken,
      refreshTokenExpired:
        Date.now() + refreshedTokens.data.refresh_expires_in * 1000,
    };
  } catch (e) {
    console.error(e);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
};

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: 'hasura',
      clientSecret:
        process.env.KEYCLOAK_HASURA_CLIENT_SECRET ||
        process.env.CLIENT_SECRET ||
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.NEXT_AUTH_CLIENT_SECRET!,
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
    jwt: async ({ token, account, profile }) => {
      // Persist the OAuth access_token to the token right after signin
      if (account && profile) {
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        token.accessTokenExpired = account.expires_at! * 1000;
        token.refreshTokenExpired =
          Date.now() + account.refresh_expires_in * 1000;
        token.profile = profile;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpired) {
        return token;
      }

      // Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token);
      return refreshedToken;
    },
    session: async ({ session, token, user }) => {
      // Send properties to the client, like an access_token from a provider.
      if (token.error) {
        session.error = token.error;
      }
      session.accessToken = token.accessToken;
      session.user = user;
      session.profile = token.profile;
      return session;
    },
  },
});
