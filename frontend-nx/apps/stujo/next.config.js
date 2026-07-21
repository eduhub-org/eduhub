//@ts-check

const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  i18n: {
    // Replaces the *.en.stujo.net subdomains of the Rails app.
    locales: ['de', 'en'],
    defaultLocale: 'de',
  },
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    // Next 16 blocks optimizing images served from local IPs by default.
    // Re-allow it ONLY outside production so local dev (localhost above) keeps
    // working while real deployments retain the hardened default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // @vercel/nft (used to build the `output: 'standalone'` bundle) does not
  // follow the `module-sync` export condition. These ljharb helper packages
  // (pulled in transitively via `get-intrinsic`) therefore ship to the
  // standalone output WITHOUT their `require.mjs` entry. On Node 20.9+/22,
  // `require('async-function')` resolves to that missing file and crashes the
  // standalone server at runtime. Force-include the files until the upstream
  // NFT gap is fixed. See docs/APP_ROUTER_MIGRATION_PLAN.md §B.3.
  outputFileTracingIncludes: {
    '/**': [
      '../../node_modules/async-function/require.mjs',
      '../../node_modules/async-generator-function/require.mjs',
      '../../node_modules/generator-function/require.mjs',
    ],
  },
  experimental: {
    // Allow importing shared code from apps/edu-hub (via the @eduhub/*
    // tsconfig path alias) until it is extracted into root-level libs/.
    externalDir: true,
  },
};

module.exports = nextConfig;
