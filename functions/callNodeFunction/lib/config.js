/**
 * The one place callNodeFunction reads its environment.
 *
 * Every getter reads `process.env` when it is called, never at import time:
 * Cloud Functions injects secrets before the first request, and the tests set
 * `process.env` in `beforeEach` after the modules are already loaded.
 *
 * Fallbacks match what the handlers used before this module existed; a getter
 * without a fallback returns `undefined` so callers keep deciding how to fail.
 * Use `requireEnv` where a missing value must stop the request.
 */

export const DEFAULT_FRONTEND_URL = 'https://edu.opencampus.sh';

/**
 * Raw value of an environment variable.
 * @param {string} name
 * @returns {string | undefined}
 */
export const env = (name) => process.env[name];

/**
 * Value of an environment variable, or `fallback` when it is unset or empty
 * (same as `process.env[name] || fallback`).
 * @template T
 * @param {string} name
 * @param {T} fallback
 * @returns {string | T}
 */
export const envOr = (name, fallback) => process.env[name] || fallback;

/**
 * Trimmed value of an environment variable, or `null` when it is unset or
 * blank.
 * @param {string} name
 * @returns {string | null}
 */
export const trimmedEnv = (name) => {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Value of a variable that must be set. Throws at call time, so a missing
 * secret fails the request that needs it instead of the whole unit.
 * @param {string} name
 * @returns {string}
 */
export const requireEnv = (name) => {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

/** @returns {string | undefined} `ENVIRONMENT` (production, staging, ...) */
export const environment = () => process.env.ENVIRONMENT;
export const isProduction = () => environment() === 'production';
export const isDevelopment = () => environment() === 'development';

/** @returns {{ endpoint: string, adminSecret: string }} */
export const hasuraConfig = () => ({
  endpoint: requireEnv('HASURA_ENDPOINT'),
  adminSecret: requireEnv('HASURA_ADMIN_SECRET'),
});

/** Shared secret Hasura sends in the `secret` header. */
export const cloudFunctionSecret = () => process.env.HASURA_CLOUD_FUNCTION_SECRET;

/** EduHub frontend base URL, defaulting to production. */
export const frontendUrl = () => envOr('FRONTEND_URL', DEFAULT_FRONTEND_URL);

/** StuJo frontend base URL, falling back to the EduHub one (no default). */
export const stujoFrontendUrl = () =>
  process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL;

/** Address that receives StuJo platform notifications, or `null`. */
export const stujoAdminEmail = () => process.env.STUJO_ADMIN_EMAIL || null;

/**
 * Keycloak master-realm admin login.
 * @returns {{ url: string | undefined, username: string, password: string | undefined }}
 */
export const keycloakConfig = () => ({
  url: process.env.KEYCLOAK_URL,
  username: process.env.KEYCLOAK_USER || 'keycloak',
  password: process.env.KEYCLOAK_PW,
});

/** @returns {string | undefined} */
export const stripeSecretKey = () => process.env.STRIPE_SECRET_KEY;
/** @returns {string | null} */
export const stripeTaxRateId = () => process.env.STRIPE_TAX_RATE_ID || null;

/** @returns {string | undefined} */
export const formbricksApiKey = () => process.env.FORMBRICKS_API_KEY;
/** Formbricks API base URL from the first configured variable, or undefined. */
export const formbricksApiUrl = () =>
  process.env.FORMBRICKS_API_URL || process.env.FORMBRICKS_BASE_URL;
/** @returns {string | undefined} comma-separated list */
export const formbricksTrustedOrigins = () => process.env.FORMBRICKS_TRUSTED_ORIGINS;

/**
 * Matrix settings, each trimmed and `null` when blank.
 */
export const matrixConfig = () => ({
  homeserverUrl: trimmedEnv('MATRIX_HOMESERVER_URL'),
  adminAccessToken: trimmedEnv('MATRIX_ADMIN_ACCESS_TOKEN'),
  synapseAdminToken: trimmedEnv('MATRIX_SYNAPSE_ADMIN_TOKEN'),
  elementClientUrl: trimmedEnv('MATRIX_ELEMENT_CLIENT_URL'),
  mainSpaceId: trimmedEnv('MATRIX_MAIN_SPACE_ID'),
  adminUserId: trimmedEnv('MATRIX_ADMIN_USER_ID'),
  serverName: trimmedEnv('MATRIX_SERVER_NAME'),
});

/** Public base URL of the storage bucket. */
export const storageBucketPublicUrl = () => process.env.STORAGE_BUCKET_PUBLIC_URL;
/** Port of the local storage emulator (development only). */
export const storagePort = () => process.env.STORAGE_PORT;
