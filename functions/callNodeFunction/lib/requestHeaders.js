// @ts-check
/**
 * The request headers Hasura sends to callNodeFunction.
 *
 * Node lowercases incoming header names, so `Function-Name` arrives as
 * `function-name` and `Bucket` and `bucket` are the same key. The standard
 * names are `Function-Name`, `Hasura-Secret` and `Bucket` (what
 * callPythonFunction reads); `name` and `secret` are the legacy names, still
 * accepted until docs/plans/functions-header-switch.md step 3.
 */

export const FUNCTION_NAME_HEADER = 'function-name';
export const LEGACY_FUNCTION_NAME_HEADER = 'name';
export const BUCKET_HEADER = 'bucket';

/**
 * @typedef {object} FunctionNameHeader
 * @property {string | undefined} name the handler name, if any header set it
 * @property {string | null} header the header it came from
 * @property {boolean} conflict both names sent with different values
 */

/**
 * The handler a request asks for: `Function-Name`, else the legacy `name`.
 * @param {import('node:http').IncomingHttpHeaders} headers `req.headers`
 * @returns {FunctionNameHeader}
 */
export const getFunctionName = (headers) => {
  // Node joins repeated custom headers into one string.
  const current = headers[FUNCTION_NAME_HEADER];
  const legacy = headers[LEGACY_FUNCTION_NAME_HEADER];
  if (current !== undefined) {
    const name = String(current);
    const conflict = legacy !== undefined && String(legacy) !== name;
    return { name, header: FUNCTION_NAME_HEADER, conflict };
  }
  if (legacy !== undefined) {
    return { name: String(legacy), header: LEGACY_FUNCTION_NAME_HEADER, conflict: false };
  }
  return { name: undefined, header: null, conflict: false };
};

/**
 * Storage bucket a handler works on (`Bucket` header, set per action).
 * @param {{ headers: import('node:http').IncomingHttpHeaders }} req
 * @returns {string | undefined}
 */
export const getBucket = (req) => {
  const bucket = req.headers[BUCKET_HEADER];
  return bucket === undefined ? undefined : String(bucket);
};
