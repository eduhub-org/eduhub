// Flat ESLint config (ESLint 9). Replaces the former .eslintrc.json files at
// the workspace root and in apps/edu-hub and apps/stujo.
//
// Layering (later entries win on rule conflicts):
//   1. global ignores
//   2. @eslint/js recommended                (eslint:recommended)
//   3. typescript-eslint recommended         (plugin:@typescript-eslint/recommended)
//   4. eslint-plugin-react recommended       (plugin:react/recommended)
//   5. eslint-config-next core-web-vitals    (next + next/core-web-vitals:
//      bundles @next/next, react-hooks, jsx-a11y and import; also pins the
//      TypeScript parser last so it wins for .ts/.tsx)
//   6. shared settings / globals / rule overrides
//   7. per-app rule overrides (edu-hub, stujo)

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      // Apollo codegen output — machine-generated, not hand-maintained.
      '**/__generated__/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  ...nextCoreWebVitals,

  {
    // Match the previous .eslintrc behaviour: do not flag redundant inline
    // eslint-disable directives. Many guard the deferred React Compiler rules
    // above and must stay for when those are adopted.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-extra-semi': 'error', // Use the standard rule
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      // eslint-config-next disables these two react/recommended rules; the old
      // config re-enabled them by extending react/recommended last. Restore
      // them (jsx-no-target-blank guards against reverse tabnabbing).
      'react/jsx-no-target-blank': 'error',
      'react/no-unknown-property': 'error',

      // Disabled workspace-wide (both apps previously set these identically).
      '@next/next/no-img-element': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // eslint-config-next 16 bundles react-hooks 7, whose recommended set
      // newly enables React Compiler-readiness rules as errors. This repo does
      // not use the React Compiler, and adopting these rules means changing
      // ~60 call sites — a deliberate, separate workstream. Keep the two
      // classic hook rules (rules-of-hooks / exhaustive-deps) that react-hooks
      // 5 already enforced and turn the compiler rules off for now.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/void-use-memo': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
    },
  },

  {
    // TypeScript compiler already resolves identifiers; no-undef only produces
    // false positives on types/globals in .ts/.tsx.
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },

  {
    files: ['apps/edu-hub/**/*.{ts,tsx,js,jsx}'],
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      '@next/next/no-html-link-for-pages': ['error', 'apps/edu-hub/pages'],
    },
  },

  {
    files: ['apps/stujo/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // StuJo intentionally links to /api/auth/* with plain <a> tags (full-page
      // navigations, not <Link/>), so this rule stays off.
      '@next/next/no-html-link-for-pages': 'off',
    },
  }
);
