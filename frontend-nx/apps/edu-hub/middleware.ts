import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname, searchParams } = request.nextUrl;
  const forceLogin = searchParams.get('force_login');
  const redirectTo = searchParams.get('redirectTo') || pathname;

  if (forceLogin && !token) {
    const signInPage = `/auth/signin?provider=keycloak&callbackUrl=${encodeURIComponent(redirectTo)}`;
    if (pathname !== signInPage) {
      return NextResponse.redirect(new URL(signInPage, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
