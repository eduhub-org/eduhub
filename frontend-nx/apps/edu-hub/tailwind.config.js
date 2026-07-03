const { join } = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  plugins: [require('@tailwindcss/typography')],
  content: [
    join(__dirname, '/pages/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, '/components/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        32: 'repeat(32, minmax(0, 1fr))',
        24: 'repeat(24, minmax(0, 1fr))',
      },
      colors: {
        // Semantic colors (preferred)
        brand: {
          DEFAULT: 'var(--eduhub-brand)',
          light: 'var(--eduhub-brand-light)',
          dark: 'var(--eduhub-brand-dark)',
        },
        fill: {
          primary: 'var(--eduhub-fill-primary)',
          secondary: 'var(--eduhub-fill-secondary)',
          disabled: 'var(--eduhub-fill-disabled)',
        },
        label: {
          primary: 'var(--eduhub-label-primary)',
          secondary: 'var(--eduhub-label-secondary)',
          disabled: 'var(--eduhub-label-disabled)',
        },
        border: {
          primary: 'var(--eduhub-border-primary)',
          secondary: 'var(--eduhub-border-secondary)',
        },
        bg: {
          primary: 'var(--eduhub-bg-primary)',
          secondary: 'var(--eduhub-bg-secondary)',
          modal: 'var(--eduhub-bg-modal)',
          card: 'var(--eduhub-bg-card)',
          footer: 'var(--eduhub-bg-footer)',
        },
        success: 'var(--eduhub-success)',
        warning: 'var(--eduhub-warning)',
        error: 'var(--eduhub-error)',
        info: 'var(--eduhub-info)',
        badge: 'var(--eduhub-badge)',
        'badge-contrast': 'var(--eduhub-badge-contrast)',
        status: {
          confirmed: 'var(--eduhub-status-confirmed)',
          invited: 'var(--eduhub-status-invited)',
          current: 'var(--eduhub-status-current)',
          missed: 'var(--eduhub-status-missed)',
        },
        // Legacy aliases (for gradual migration)
        'edu-black': 'var(--eduhub-label-primary)',
        'edu-light-gray': 'var(--eduhub-fill-secondary)',
        'edu-dark-gray': 'var(--eduhub-label-secondary)',
        'edu-bg-gray': 'var(--eduhub-bg-primary)',
        'edu-course-current': 'var(--eduhub-status-current)',
        'edu-course-invited': 'var(--eduhub-status-invited)',
        'edu-green': 'var(--eduhub-brand)',
        'edu-confirmed': 'var(--eduhub-status-confirmed)',
        'edu-missed-yellow': 'var(--eduhub-status-missed)',
        'edu-course-list': 'var(--eduhub-fill-secondary)',
        'edu-modal-bg-color': 'var(--eduhub-bg-modal)',
        'edu-tag-color': '#C4C4C4',
        'edu-row-color': '#E5E5E5',
        'edu-red': 'var(--eduhub-error)',
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
