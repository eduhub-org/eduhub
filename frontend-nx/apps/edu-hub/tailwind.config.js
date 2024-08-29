const { join } = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');

// available since Nx v 12.5
const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

module.exports = {
  plugins: [require('@tailwindcss/line-clamp'), require('@tailwindcss/typography')],
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
        'edu-black': '#222222',
        'edu-light-gray': '#F2F2F2',
        'edu-dark-gray': '#D8D8D8',
        'edu-bg-gray': '#222222',
        'edu-course-current': '#A2EBA0',
        'edu-course-invited': '#FFA665',
        'edu-green': '#00A398',
        'edu-confirmed': '#A2EBA0',
        'edu-missed-yellow': '#F2991D66',
        'edu-course-list': '#F2F2F2',
        'edu-modal-bg-color': '#222222',
        'edu-tag-color': '#C4C4C4',
        'edu-row-color': '#E5E5E5',
        'edu-red': '#D45A5A',
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
    screens: {
      xs: '375px',
      ...defaultTheme.screens,
    },
  },
  variants: {
    extend: {},
  },
};
