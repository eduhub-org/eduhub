import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../app/api/auth/[...nextauth]';
import { AuthRoles } from '../types/enums';

interface WithAuthRedirectOptions {
  redirectTo?: string;
  forceLoginParam?: string;
}

export const withAuthRedirect = ({
  redirectTo = '/',
  forceLoginParam = 'force_login',
}: WithAuthRedirectOptions = {}): ((
  gssp?: GetServerSideProps
) => (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<any>>) => {
  return (gssp?: GetServerSideProps) =>
    async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<any>> => {
      const session = await getSession({ req: context.req });
      const { query } = context;
      const forceLogin = query[forceLoginParam];

      if (forceLogin && !session) {
        const signInPage = `/auth/signin?provider=keycloak&callbackUrl=${redirectTo}`;
        if (context.resolvedUrl !== signInPage) {
          return {
            redirect: {
              destination: signInPage,
              permanent: false,
            },
          };
        }
      }

      if (gssp) {
        return gssp(context);
      }

      return { props: {} };
    };
};

export const getIsLoggedIn = async (): Promise<boolean> => {
  const session = await getServerSession(authOptions);
  return !!session?.accessToken;
};

export const getCurrentRole = async (): Promise<AuthRoles> => {
  const session = await getServerSession(authOptions);
  const roles = session?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles'] || [];
  if (roles.includes(AuthRoles.admin)) return AuthRoles.admin;
  if (roles.includes(AuthRoles.instructor)) return AuthRoles.instructor;
  if (roles.includes(AuthRoles.user)) return AuthRoles.user;
  return AuthRoles.anonymous;
};

export const getIsAdmin = async (): Promise<boolean> => {
  const currentRole = await getCurrentRole();
  return currentRole === AuthRoles.admin;
};
