import { Profile } from 'next-auth';

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    accessToken?: string;
    profile?: Profile;
    idToken?: string;
    name: string;
    email: string;
    sub: string;
    refreshToken?: string;
    accessTokenExpired: number;
    refreshTokenExpired: number;
    error?: string;
  }
}

declare module 'next-auth' {
  interface Account {
    provider: string;
    type: string;
    id: string;
    access_token?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accessTokenExpires: any;
    refresh_token?: string;
    id_token?: string;
    expires_at?: number;
    expires_in: number;
    refresh_expires_in: number;
    token_type?: string;
    'not-before-policy': number;
    session_state?: string;
    scope?: string;
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    error?: string;
    profile?: Profile;
  }

  interface Profile {
    'https://hasura.io/jwt/claims'?: {
      'x-hasura-allowed-roles'?: string[];
      'x-hasura-default-role'?: string;
      'x-hasura-user-id'?: string;
    };
    email: string | undefined;
    given_name: string | undefined;
    family_name: string | undefined;
    preferred_username: string | undefined;
    email_verified: boolean;
  }
}
