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
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    // Allow importing shared code from apps/edu-hub (via the @eduhub/*
    // tsconfig path alias) until it is extracted into root-level libs/.
    externalDir: true,
  },
};

module.exports = nextConfig;
