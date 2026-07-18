//@ts-check

const path = require('path');

/**
 * Extract hostname from a URL
 */
const getHostnameFromUrl = (/** @type {string} */ url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    let urlToParse = url.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = `https://${urlToParse}`;
    }
    return new URL(urlToParse).hostname;
  } catch {
    return null;
  }
};

/**
 * Build remote patterns dynamically from environment variables
 */
const buildRemotePatterns = () => {
  const patterns = [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '4001',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
    },
    {
      protocol: 'https',
      hostname: 'localhost',
    },
    {
      protocol: 'https',
      hostname: 'picsum.photos',
    },
    {
      protocol: 'https',
      hostname: 'storage.googleapis.com',
    },
  ];

  // Add hostname from NEXT_PUBLIC_STORAGE_BUCKET_URL if it exists and isn't localhost
  const storageBucketUrl = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
  if (storageBucketUrl) {
    const hostname = getHostnameFromUrl(storageBucketUrl);
    if (hostname && hostname !== 'localhost' && !patterns.some(p => p.hostname === hostname)) {
      if (storageBucketUrl.trim().startsWith('https')) {
        patterns.push({ protocol: 'https', hostname });
      } else {
        patterns.push({ protocol: 'http', hostname });
      }
    }
  }

  // Add hostname from NEXT_PUBLIC_BASE_URL if it exists and isn't localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    const hostname = getHostnameFromUrl(baseUrl);
    if (hostname && hostname !== 'localhost' && !patterns.some(p => p.hostname === hostname)) {
      if (baseUrl.trim().startsWith('https')) {
        patterns.push({ protocol: 'https', hostname });
      } else {
        patterns.push({ protocol: 'http', hostname });
      }
    }
  }

  return patterns;
};

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'de',
  },
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    // @ts-expect-error - TypeScript has trouble inferring literal types when pushing to arrays in JS files
    remotePatterns: buildRemotePatterns(),
    // Next 16 blocks optimizing images served from local IPs by default. In
    // development images are served through next/image from the local storage
    // emulator (localhost:4001, see remotePatterns above); re-allow that ONLY
    // outside production so real deployments keep the hardened default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
  // https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
  // Moved from experimental in Next.js 15
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
  async redirects() {
    return [
      { source: '/impressum', destination: '/imprint', permanent: true },
      // Settings reorganization: old admin routes live on as redirects
      { source: '/manage/app-settings', destination: '/manage/settings', permanent: false },
      { source: '/manage/email-templates', destination: '/manage/settings/emails', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Apply permissive headers to widget routes to allow iframe embedding
        source: '/widget/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
