// @ts-check
/**
 * Small JSON HTTP client on native fetch, with the parts of axios' contract
 * the handlers relied on:
 * - resolves `{ status, data, headers }`, `data` parsed as JSON when it is
 *   JSON and left as text otherwise;
 * - rejects for a status outside 2xx (unless `validateStatus` accepts it)
 *   with `Request failed with status code N` and `error.response`
 *   (`{ status, data }`);
 * - plain objects and arrays are sent as JSON, URLSearchParams as a form;
 * - `timeout` (ms) aborts the request with a `TimeoutError`.
 */

/**
 * @typedef {object} HttpOptions
 * @property {Record<string, string>} [headers]
 * @property {number} [timeout] milliseconds
 * @property {(status: number) => boolean} [validateStatus]
 * @property {unknown} [data] request body (for `delete`)
 */

/**
 * @typedef {object} HttpResponse
 * @property {number} status
 * @property {any} data
 * @property {Headers} headers
 */

export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {any} data
   */
  constructor(status, data) {
    super(`Request failed with status code ${status}`);
    this.name = 'HttpError';
    this.code = status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST';
    this.status = status;
    this.response = { status, data };
  }
}

const defaultValidateStatus = (status) => status >= 200 && status < 300;

const encodeBody = (data, headers) => {
  if (data === undefined || data === null) return undefined;
  if (typeof data === 'string' || data instanceof URLSearchParams) return data;
  if (!Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }
  return JSON.stringify(data);
};

const parseBody = (text) => {
  if (text === '') return '';
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
};

/**
 * @param {string} method
 * @param {string} url
 * @param {unknown} body
 * @param {HttpOptions} [options]
 * @returns {Promise<HttpResponse>}
 */
export const request = async (method, url, body, options = {}) => {
  const { timeout, validateStatus = defaultValidateStatus } = options;
  const headers = { ...(options.headers || {}) };
  const response = await fetch(url, {
    method,
    headers,
    body: encodeBody(body, headers),
    signal: timeout ? AbortSignal.timeout(timeout) : undefined,
  });
  const data = parseBody(await response.text());
  if (!validateStatus(response.status)) {
    throw new HttpError(response.status, data);
  }
  return { status: response.status, data, headers: response.headers };
};

/**
 * True for a failure before any HTTP response arrived (connection refused or
 * reset, DNS, timeout), the cases worth retrying.
 * @param {any} error
 */
export const isNetworkError = (error) =>
  !error?.response &&
  (error?.name === 'TimeoutError' ||
    error?.name === 'AbortError' ||
    (error instanceof TypeError && error.message === 'fetch failed'));

export const http = {
  /** @param {string} url @param {HttpOptions} [options] */
  get: (url, options) => request('GET', url, undefined, options),
  /** @param {string} url @param {unknown} body @param {HttpOptions} [options] */
  post: (url, body, options) => request('POST', url, body, options),
  /** @param {string} url @param {unknown} body @param {HttpOptions} [options] */
  put: (url, body, options) => request('PUT', url, body, options),
  /** @param {string} url @param {HttpOptions} [options] */
  delete: (url, options) => request('DELETE', url, options?.data, options),
};
