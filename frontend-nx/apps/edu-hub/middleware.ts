import createIntlMiddleware from 'next-intl/middleware';

export default createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'de'],
  
  // Used when no locale matches
  defaultLocale: 'de',
  
  // Redirect users to the default locale instead of
  // showing a 404 when they visit the root path
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*']
};
