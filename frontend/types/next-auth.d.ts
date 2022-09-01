import NextAuth, { DefaultSession, Profile } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    profile?: Profile;
  }

  interface Profile {
    "https://hasura.io/jwt/claims"?: {
      "x-hasura-allowed-roles"?: string[];
      "x-hasura-default-role"?: string;
      "x-hasura-user-id"?: string;
    };
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    accessToken?: string;
    profile?: Profile;
  }
}
