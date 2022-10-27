import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import Cors from "cors";

const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
  origin: "*",
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  try {
    const token = await getToken({ req });

    if (!token && process.env.NEXTAUTH_URL) {
      console.warn(
        "No JWT token found when calling /federated-logout endpoint,"
      );
      return res.redirect(307, process.env.NEXTAUTH_URL);
    }
    if (token && !token.idToken)
      throw new Error(
        "Without an id_token the user won't be redirected back from the IdP after logout."
      );

    if (token && token.idToken && process.env.NEXT_PUBLIC_AUTH_URL) {
      const endsessionURL = `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/protocol/openid-connect/logout`;
      const endsessionParams = new URLSearchParams([
        ["id_token_hint", token.idToken],
        [
          "post_logout_redirect_uri",
          process.env.NEXTAUTH_URL || "http://localhost:5000",
        ],
      ]);
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.redirect(307, `${endsessionURL}?${endsessionParams}`);
    }
    throw new Error("Something went wrong - see federated-logout");
  } catch (error) {
    console.error(error);
  }
}
