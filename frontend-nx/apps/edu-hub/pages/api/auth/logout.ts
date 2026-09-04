import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Calling logout handler!');

  // Logging out locally must still work if the Keycloak session is already
  // gone or the token does not contain an id_token. The clients use this URL
  // as their safe fallback instead of being left on an unfinished API request.
  const fallbackUrl = process.env.NEXTAUTH_URL || '/';

  try {
    const token = await getToken({ req });

    if (!token) {
      console.warn('No JWT token found when calling /logout endpoint.');
      return res.status(200).json({ url: fallbackUrl });
    }
    if (!token.idToken) {
      console.warn('No id_token found; skipping the Keycloak end-session redirect.');
      return res.status(200).json({ url: fallbackUrl });
    }

    if (process.env.NEXT_PUBLIC_AUTH_URL) {
      const endsessionURL = `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/protocol/openid-connect/logout`;
      const endsessionParams = new URLSearchParams([
        ['id_token_hint', token.idToken],
        ['post_logout_redirect_uri', fallbackUrl],
      ]);
      return res.status(200).json({ url: `${endsessionURL}?${endsessionParams}` });
    }

    console.warn('NEXT_PUBLIC_AUTH_URL is not configured; skipping Keycloak logout.');
    return res.status(200).json({ url: fallbackUrl });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ url: fallbackUrl });
  }
};

export default handler;
