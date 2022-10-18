import jwt from "next-auth/jwt";
import type { NextApiRequest, NextApiResponse } from "next";

const federatedLogout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const token = await jwt.getToken({
      req,
      secret: process.env.SECRET,
      encryption: true,
    });
    if (!token) {
      console.log("No JWT token found when calling /federated-logout endpoint");
      return res.redirect(process.env.NEXTAUTH_URL);
    }
    if (!token.idToken) {
      console.log(
        "Without an id_token the user won't be redirected back from the IdP after logout."
      );
    }

    const endsessionURL = `https://${process.env.PROVIDER_DOMAIN}/connect/endsession`;
    const endsessionParams = new URLSearchParams({
      id_token_hint: token.idToken,
      post_logout_redirect_uri: process.env.NEXTAUTH_URL,
    });
    return res.redirect(`${endsessionURL}?${endsessionParams}`);
  } catch (error) {
    res.redirect(process.env.NEXTAUTH_URL);
  }
};

export default federatedLogout;
