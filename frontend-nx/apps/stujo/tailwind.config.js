const { join } = require('path');

const eduHubConfig = require('../edu-hub/tailwind.config.js');

/**
 * StuJo shares edu-hub's Tailwind theme so that edu-hub components can be
 * reused here instead of forked (AGENTS.md critical rule 10). That works
 * because every colour in edu-hub's theme resolves to a `var(--eduhub-*)`
 * token: StuJo redefines those tokens with its own values in
 * `styles/globals.css`, and the same component renders in StuJo's branding.
 *
 * Two things must differ from edu-hub's config:
 *
 *   `content` has to cover edu-hub's components as well as StuJo's own files.
 *   Tailwind only emits the classes it finds, and edu-hub's globs are relative
 *   to edu-hub — without the third entry a shared component renders unstyled.
 *
 *   `preflight` stays off. StuJo's stylesheet is a 1:1 port of the Rails app
 *   and leans on browser defaults for headings, links, lists and table cells,
 *   plus it sets its own `box-sizing` and `body` rules. Tailwind's reset would
 *   restyle every existing page, which is a change worth making on its own
 *   rather than inside a feature. See docs/STUJO_INTEGRATION_PLAN.md §8.1.
 */
module.exports = {
  ...eduHubConfig,
  corePlugins: {
    preflight: false,
  },
  content: [
    join(__dirname, '/pages/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, '/components/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, '../edu-hub/components/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    ...eduHubConfig.theme,
    // Lato with the live site's fallbacks, not edu-hub's Space Grotesk, so
    // shared components read like the surrounding StuJo chrome.
    fontFamily: {
      body: ['var(--stujo-font)'],
    },
  },
};
