import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import i18n from './i18n';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname, searchParams } = request.nextUrl;
  const forceLogin = searchParams.get('force_login');
  const redirectTo = searchParams.get('redirectTo') || pathname;

  // Check if the pathname starts with a locale
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = i18n.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

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
