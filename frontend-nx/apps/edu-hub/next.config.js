//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nx/next/plugins/with-nx');
const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin(path.join(__dirname, 'i18n/request.ts'));

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: true,
  },
  output: 'standalone',
  images: {
    domains: ['picsum.photos', 'images.unsplash.com', 'storage.googleapis.com', 'localhost'],
  },
  experimental: {
    // https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  // App Router doesn't use built-in i18n - next-intl handles it
  
  // Improve hot reloading in Docker
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = withNx(withNextIntl(nextConfig));
