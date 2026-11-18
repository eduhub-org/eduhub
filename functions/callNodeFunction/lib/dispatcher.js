// @ts-check
import { constantTimeSecretsEqual, getProvidedSecret, SECRET_HEADER } from '../shared/security.js';
import { cloudFunctionSecret } from './config.js';
import { logger } from './logger.js';
import { getFunctionName } from './requestHeaders.js';

/**
 * Adds the fields Hasura reads from a non-2xx action response: `message`
 * (the error text) and `extensions.code` (the `messageKey`). Fields already
 * set and all other fields stay, since callers and logs read them.
 * @param {Record<string, any>} body
 * @returns {Record<string, any>}
 */
const withHasuraError = (body) => {
  const out = { ...body };
  if (out.message === undefined) out.message = String(out.error ?? "Function failed");
  if (out.extensions === undefined && out.messageKey) out.extensions = { code: out.messageKey };
  return out;
};

/**
 * Validates the Hasura secret from the request headers.
 * @param {string | string[] | undefined} hasuraSecret - The secret from request headers
 * @returns {{ isValid: boolean, statusCode?: number, error?: object }}
 */
const validateSecret = (hasuraSecret) => {
  const hasuraCloudFunctionSecret = cloudFunctionSecret();

  if (!hasuraCloudFunctionSecret || typeof hasuraCloudFunctionSecret !== "string" || hasuraCloudFunctionSecret.trim() === "") {
    return {
      isValid: false,
      statusCode: 500,
      error: withHasuraError({
        success: false,
        error: "Server secret is not configured.",
        messageKey: "SERVER_MISCONFIGURED"
      })
    };
  }

  if (!hasuraSecret || typeof hasuraSecret !== "string") {
    return {
      isValid: false,
      statusCode: 401,
      error: withHasuraError({
        success: false,
        error: "Missing secret header.",
        messageKey: "MISSING_SECRET"
      })
    };
  }

  if (!constantTimeSecretsEqual(hasuraSecret, hasuraCloudFunctionSecret)) {
    return {
      isValid: false,
      statusCode: 401,
      error: withHasuraError({
        success: false,
        error: "Invalid secret provided.",
        messageKey: "INVALID_SECRET"
      })
    };
  }

  return { isValid: true };
};

/**
 * Returns a redacted summary of a response for safe logging (avoids persisting URLs, tokens, etc.).
 * @param {*} response - The raw response object
 * @returns {Object} Safe summary for logging
 */
const redactForLogging = (response) => {
  if (!response || typeof response !== "object") return { type: typeof response };
  /** @type {Record<string, any>} */
  const summary = { success: response.success, messageKey: response.messageKey };
  if (response.enrollmentId) summary.hasEnrollmentId = true;
  if (response.checkoutUrl) summary.hasCheckoutUrl = true;
  if (response.link) summary.hasLink = true;
  if (response.filePath) summary.hasFilePath = true;
  if (response.accessUrl) summary.hasAccessUrl = true;
  if (response.sessionId) summary.hasSessionId = true;
  if (response.selectedAddons) summary.addonCount = response.selectedAddons.length;
  return summary;
};

/**
 * Standardizes the response format by ensuring success flag is present.
 * @param {*} result - The function result
 * @returns {Object} Standardized response with success flag
 */
const formatResponse = (result) => {
  // If result already has success/error properties, return it directly
  if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
    return result;
  }
  // Add success flag for normal responses
  return {
    success: true,
    data: result
  };
};

/**
 * Builds a dispatcher: one Cloud Functions HTTP entry point that routes each
 * Hasura request to one of `handlers` by its `Function-Name` (legacy: `name`)
 * header. Every unit built from callNodeFunction's code (callNodeFunction,
 * identity, media) is one of these; they differ only in their handler map
 * and in the secrets Terraform gives each unit.
 *
 * Status codes (docs/SERVERLESS_FUNCTIONS.md, "Request contract"): 401 for a
 * missing or wrong secret, 500 when the server secret is unset, 400 when
 * `Function-Name` and `name` disagree, 404 for a handler not in `handlers`,
 * 503 for a failure the handler marks `retryable` in an event or cron
 * trigger (even when it also sets a 2xx `httpStatus`), the handler's
 * `httpStatus` when it sets one, and 200 otherwise,
 * including `success: false` results and thrown errors. Every non-2xx body
 * also carries Hasura's `message` and `extensions: { code: messageKey }`.
 *
 * `pinnedActions` maps an action name to the handler it must run. An action
 * with `forward_client_headers: true` passes the caller's own HTTP headers on
 * to the unit, so a caller could send a `Function-Name` or `name` header of
 * their choice next to the one in the metadata. For a pinned action the
 * handler follows `action.name` in the body, which Hasura sets, and a routing
 * header naming any other handler answers 400. The registry test requires
 * every action that forwards client headers to be pinned.
 *
 * @param {{
 *   name: string,
 *   handlers: Record<string, import('./types.js').Handler>,
 *   pinnedActions?: Record<string, string>,
 * }} options `name` is the unit name used in logs.
 * @returns {(req: import('express').Request, res: import('express').Response) => Promise<any>}
 */
export const createDispatcher = ({ name: unitName, handlers, pinnedActions = {} }) => async (req, res) => {
  const secretValidation = validateSecret(getProvidedSecret(req.headers));
  if (!secretValidation.isValid) {
    return res.status(secretValidation.statusCode).json(secretValidation.error);
  }

  const { name, header, conflict } = getFunctionName(req.headers);
  const actionName = req.body?.action?.name;
  const pinned = typeof actionName === "string" && Object.hasOwn(pinnedActions, actionName)
    ? pinnedActions[actionName]
    : undefined;
  if (conflict || (pinned !== undefined && name !== undefined && name !== pinned)) {
    return res.status(400).json(withHasuraError({
      success: false,
      error: "Function-Name and name headers name different functions.",
      messageKey: "CONFLICTING_FUNCTION_NAME"
    }));
  }
  const functionName = String(pinned ?? name);

  // Shows how far the switch to the standard header names has got
  // (docs/plans/functions-header-switch.md).
  logger.debug("Request header names", {
    unit: unitName,
    functionNameHeader: header,
    secretHeader: req.headers[SECRET_HEADER] !== undefined ? SECRET_HEADER : "secret",
  });
  logger.info(`Received request for function: ${functionName}`, { unit: unitName });

  // Own properties only: `in` walks the prototype chain, so a name header of
  // `constructor` would resolve to `Object` and `__proto__` to `Object.prototype`.
  // Neither is reachable without the shared secret, checked above - this is
  // defence in depth, not a fix for a live hole.
  if (!Object.prototype.hasOwnProperty.call(handlers, functionName)) {
    return res.status(404).json(withHasuraError({
      success: false,
      error: "Function Not Found",
      messageKey: "FUNCTION_NOT_FOUND"
    }));
  }

  try {
    logger.info(`Executing function: ${functionName}`, { unit: unitName });
    const result = await handlers[functionName](req, logger);

    // Event and cron triggers retry only on a non-2xx answer. Handlers opt in
    // per failure with `retryable`, since most failures (a deleted row, a
    // missing address) would fail the same way again; a handler that does opt
    // in must make its side effect idempotent across deliveries. A cron request
    // carries `scheduled_time` instead of `event`. `retryable` wins over a 2xx
    // `httpStatus`, which would stop Hasura from retrying; a non-2xx one
    // already makes Hasura retry and is passed through below.
    const hasStatus = Number.isInteger(result?.httpStatus);
    const is2xx = hasStatus && result.httpStatus >= 200 && result.httpStatus < 300;
    if ((req.body.event || req.body.scheduled_time) && result?.retryable && (!hasStatus || is2xx)) {
      const body = { ...result };
      delete body.httpStatus;
      logger.warn(`Retryable failure in ${functionName}`, { unit: unitName, response: redactForLogging(body) });
      return res.status(503).json(withHasuraError(body));
    }

    // A handler that must answer with a given status sets `httpStatus`, e.g.
    // an action whose caller relies on Hasura turning a 4xx into a GraphQL
    // error (updateFromKeycloak), or an event trigger that must fail with a
    // non-2xx so Hasura retries it. Hasura reads `message` (and
    // `extensions`) from an action's non-2xx body, so a non-2xx gets them.
    // The field itself is not sent.
    if (hasStatus) {
      const { httpStatus, ...rest } = result;
      const body = is2xx ? rest : withHasuraError(rest);
      logger.info(`Function ${functionName} answered ${httpStatus}`, {
        unit: unitName,
        response: redactForLogging(body)
      });
      return res.status(httpStatus).json(body);
    }

    // Mutation actions get the handler's result as is; everything else gets
    // `{ success: true, data }` when the result has no success/error field.
    const body = req.body.request_query?.includes('mutation') ? result : formatResponse(result);

    logger.info(`Successfully executed function: ${functionName}`, {
      unit: unitName,
      response: redactForLogging(body)
    });

    return res.status(200).json(body);
  } catch (error) {
    logger.error(`Error in ${functionName}`, {
      unit: unitName,
      error: error.message,
      stack: error.stack
    });

    // A thrown error is not retried: actions read the body, and an event
    // that throws would usually throw again.
    return res.status(200).json({
      success: false,
      error: error.message || "Internal Server Error",
      messageKey: error.messageKey || "INTERNAL_SERVER_ERROR",
    });
  }
};
