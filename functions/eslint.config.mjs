// ESLint flat config for the serverless functions (errors only, no style).
//
// Run from functions/ without installing anything into the units:
//   npx --yes eslint@10.14.0 .
// The version is pinned in .github/workflows/functions-code-checks.yml.
// Globals are listed inline because the config must load without a local
// node_modules (no `globals` package available to npx).

const nodeGlobals = {
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  Blob: 'readonly',
  Buffer: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Intl: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  TextDecoder: 'readonly',
  TextEncoder: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  clearImmediate: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  crypto: 'readonly',
  fetch: 'readonly',
  global: 'readonly',
  globalThis: 'readonly',
  performance: 'readonly',
  process: 'readonly',
  queueMicrotask: 'readonly',
  setImmediate: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  structuredClone: 'readonly',
};

const commonjsGlobals = {
  __dirname: 'readonly',
  __filename: 'readonly',
  exports: 'writable',
  module: 'writable',
  require: 'readonly',
};

const jestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  jest: 'readonly',
  test: 'readonly',
};

const errorRules = {
  'no-dupe-keys': 'error',
  'no-import-assign': 'error',
  'no-redeclare': 'error',
  'no-undef': 'error',
  'no-unreachable': 'error',
  'no-unused-vars': [
    'error',
    { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true },
  ],
};

// Units whose package.json has "type": "module": their .js files are ESM.
const esmUnits = [
  'addKeycloakRole',
  'callNodeFunction',
  'removeKeycloakRole',
  'updateFromKeycloak',
];

export default [
  {
    ignores: ['**/node_modules/**', '**/coverage/**'],
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    ignores: esmUnits.map((unit) => `${unit}/**/*.js`),
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...nodeGlobals, ...commonjsGlobals },
    },
    rules: errorRules,
  },
  {
    files: [...esmUnits.map((unit) => `${unit}/**/*.js`), '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: errorRules,
  },
  {
    files: ['**/__tests__/**', '**/*.test.js', '**/*.test.cjs', '**/jest.setup.js'],
    languageOptions: {
      globals: { ...nodeGlobals, ...jestGlobals },
    },
  },
];
