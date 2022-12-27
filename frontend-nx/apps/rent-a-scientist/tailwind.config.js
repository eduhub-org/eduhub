const { join } = require('path');

// available since Nx v 12.5
const { createGlobPatternsForDependencies } = require('@nrwl/next/tailwind');

module.exports = {
  plugins: [],
  content: [
    join(__dirname, '/pages/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, '/components/**/*.{js,ts,jsx,tsx}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        32: 'repeat(32, minmax(0, 1fr))',
        24: 'repeat(24, minmax(0, 1fr))',
      },
      colors: {
        'rsa-black': '#222222',
        'rsa-background': 'rgb(149, 193, 31)',
        'rsa-green': 'rgb(149, 193, 31)',
        'rsa-blue': 'rgb(0, 63, 103)',
      },
    },
    fontFamily: {
      body: ['"Space Grotesk"', '"sans-serif"'],
    },
    listStyleType: {
      check: '{ list-style-image: url(img/iphone.png); }',
    },
    minWidth: {
      menu: '225px',
    },
  },
  variants: {
    extend: {},
  },
};
