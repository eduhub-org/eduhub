import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from 'next-auth/react';

interface WithAuthRedirectOptions {
  redirectTo?: string;
  forceLoginParam?: string;
}

export const withAuthRedirect = ({ redirectTo = '/', forceLoginParam = 'force_login' }: WithAuthRedirectOptions = {}): ((
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

