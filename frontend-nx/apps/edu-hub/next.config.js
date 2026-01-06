//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nx/next/plugins/with-nx');

const path = require('path');

/**
 * Extract hostname from a URL
 */
const getHostnameFromUrl = (url) => {
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
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: true,
  },
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'de',
  },
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    // @ts-expect-error - TypeScript has trouble inferring literal types when pushing to arrays in JS files
    remotePatterns: buildRemotePatterns(),
  },
  // https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
  // Moved from experimental in Next.js 15
  outputFileTracingRoot: path.join(__dirname, '../../'),
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
module.exports = withNx(nextConfig);
