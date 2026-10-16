/**
 * Client for the Rausgegangen API (https://api.zentrale.rausgegangen.de/v2/).
 *
 * The API key is a query parameter and tied to one Rausgegangen team; every
 * object it creates belongs to that team. POST/PUT create an object, or
 * overwrite the one with the same id or mapping_id completely; PATCH changes
 * only the given fields.
 *
 * There is no sandbox: everything goes to the live platform. So the safety rules
 * for non-production environments live here, in one place:
 * - events and locations are always sent unpublished,
 * - mapping ids carry the environment, so staging and production never
 *   overwrite each other's objects even with the same team key,
 * - stored Rausgegangen ids are never sent, so a staging database restored from
 *   production cannot address live objects.
 */

const DEFAULT_API_URL = 'https://api.zentrale.rausgegangen.de/v2';
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;
const REQUEST_TIMEOUT_MS = 20000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isProduction = () => process.env.ENVIRONMENT === 'production';

/**
 * The mapping id of one of our objects: `eduhub-event-12`, `eduhub-event-12-show`,
 * `eduhub-location-3`; outside production prefixed with the environment
 * (`eduhub-staging-event-12`).
 */
export const mappingId = (kind, id) => {
  const environment = (process.env.ENVIRONMENT || 'development').trim();
  return isProduction() ? `eduhub-${kind}-${id}` : `eduhub-${environment}-${kind}-${id}`;
};

export class RausgegangenApiError extends Error {
  constructor(message, { status, body, retryable } = {}) {
    super(message);
    this.name = 'RausgegangenApiError';
    this.status = status;
    this.body = body;
    this.retryable = Boolean(retryable);
  }
}

/** The first readable error of a DRF error body: {"detail": "..."} or {"field": ["..."]}. */
const describeErrorBody = (body) => {
  if (!body) return '';
  if (typeof body === 'string') return body.slice(0, 300);
  if (typeof body.detail === 'string') return body.detail;
  return Object.entries(body)
    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : JSON.stringify(messages)}`)
    .join('; ')
    .slice(0, 300);
};

/**
 * Drops stored ids and forces `published: false` outside production. Our
 * objects are addressed by mapping_id alone there.
 */
const applyEnvironmentRules = (payload) => {
  if (isProduction()) return payload;
  const { id: _id, ...rest } = payload;
  return 'published' in rest ? { ...rest, published: false } : rest;
};

/**
 * @param {Object} options
 * @param {string} options.apiKey
 * @param {Object} [options.logger]
 * @param {Function} [options.fetchImpl] - injectable for tests
 * @param {number} [options.backoffMs]
 */
export const createRausgegangenClient = ({ apiKey, logger, fetchImpl = globalThis.fetch, backoffMs = BASE_BACKOFF_MS }) => {
  if (!apiKey) {
    throw new Error('Rausgegangen API key is missing');
  }
  const baseUrl = (process.env.RAUSGEGANGEN_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

  const request = async (method, path, { query = {}, body } = {}) => {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('api_key', apiKey);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetchImpl(url, {
          method,
          headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        const text = await response.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (response.ok) return data;

        const retryable = response.status >= 500 || response.status === 429;
        lastError = new RausgegangenApiError(
          `Rausgegangen ${method} ${path} failed with ${response.status}: ${describeErrorBody(data)}`,
          { status: response.status, body: data, retryable }
        );
        if (!retryable) throw lastError;
      } catch (error) {
        if (error instanceof RausgegangenApiError && !error.retryable) throw error;
        lastError =
          error instanceof RausgegangenApiError
            ? error
            : new RausgegangenApiError(`Rausgegangen ${method} ${path} failed: ${error.message}`, { retryable: true });
      }

      if (attempt < MAX_ATTEMPTS) {
        logger?.warn?.(`Retrying Rausgegangen ${method} ${path} (attempt ${attempt + 1})`);
        await sleep(backoffMs * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  };

  return {
    /** Creates or overwrites the event with payload.mapping_id. Returns the event (with its id). */
    putEvent: (payload) => request('PUT', '/events/', { body: applyEnvironmentRules(payload) }),
    /** Changes only the given fields of the event with payload.mapping_id. */
    patchEvent: (payload) => request('PATCH', '/events/', { body: applyEnvironmentRules(payload) }),
    /** Creates or overwrites the show with payload.mapping_id. Returns it with public_url / preview_url. */
    putShow: (payload) => request('PUT', '/shows/', { body: applyEnvironmentRules(payload) }),
    /** Creates or overwrites one of our own locations (payload.mapping_id). */
    putLocation: (payload) => request('PUT', '/locations/', { body: applyEnvironmentRules(payload) }),
    /**
     * Searches all Rausgegangen locations, ours and others'. Read-only, so it is
     * the same in every environment.
     * @returns {Promise<Array>} up to 20 locations, most relevant first
     */
    searchLocations: async ({ q, city, street, zipCode, lat, lng } = {}) => {
      const data = await request('GET', '/locations/search', {
        query: { q, address_city: city, address_street: street, address_zipcode: zipCode, lat, lng },
      });
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.results) ? data.results : [];
    },
  };
};
