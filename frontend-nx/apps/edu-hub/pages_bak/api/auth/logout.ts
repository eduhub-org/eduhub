import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Calling logout handler!');

  try {
    const token = await getToken({ req });

    if (!token && process.env.NEXTAUTH_URL) {
      console.warn('No JWT token found when calling /logout endpoint,');
      return res.redirect(307, process.env.NEXTAUTH_URL);
    }
    if (token && !token.idToken) {
      throw new Error(
        "Without an id_token the user won't be redirected back from the IdP after logout."
      );
    }

    if (token && token.idToken && process.env.NEXT_PUBLIC_AUTH_URL) {
      const endsessionURL = `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/protocol/openid-connect/logout`;
      const endsessionParams = new URLSearchParams([
        ['id_token_hint', token.idToken],
        [
          'post_logout_redirect_uri',
          process.env.NEXTAUTH_URL || 'http://localhost:5000',
        ],
      ]);
      return res
        .status(200)
        .json(JSON.stringify({ url: `${endsessionURL}?${endsessionParams}` }));
    }
    throw new Error('Something went wrong - see logout');
  } catch (error) {
    console.error(error);
  }
};

export default handler;
