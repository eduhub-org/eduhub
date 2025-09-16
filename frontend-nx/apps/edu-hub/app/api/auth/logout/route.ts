import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  console.log('Calling logout handler!');

  try {
    const token = await getToken({ req: request });

    if (!token && process.env.NEXTAUTH_URL) {
      console.warn('No JWT token found when calling /logout endpoint,');
      return NextResponse.redirect(process.env.NEXTAUTH_URL, { status: 307 });
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
      
      return NextResponse.json(
        JSON.stringify({ url: `${endsessionURL}?${endsessionParams}` }),
        { status: 200 }
      );
    }
    
    throw new Error('Something went wrong - see logout');
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
