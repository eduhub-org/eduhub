import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'de'],
  
  // Used when no locale matches
  defaultLocale: 'de',
  
  // Always use the default locale for the root path
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames, exclude static files and API routes
  matcher: [
    // Match all requests except for:
    // - API routes starting with `/api/`
    // - Static files (containing a dot like .js, .css, .png, etc.)
    // - Next.js internal files starting with `_next/`
    // - Vercel internal files starting with `_vercel/`
    '/((?!api|_next|_vercel|.*\\.).*)'
  ]
};
