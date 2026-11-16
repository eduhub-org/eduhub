// @ts-check
/**
 * Shared JSDoc types for callNodeFunction. Type-only: nothing to import at
 * runtime; reference them as `import('./lib/types.js').Handler`.
 */

/**
 * Body Hasura sends: `input` and `session_variables` for actions, `event` for
 * event triggers, `scheduled_time` and `payload` for cron triggers.
 * @typedef {object} HasuraRequestBody
 * @property {Record<string, any>} [input]
 * @property {Record<string, string>} [session_variables]
 * @property {Record<string, any>} [event]
 * @property {string} [scheduled_time]
 * @property {any} [payload]
 * @property {string} [request_query]
 */

/**
 * One routed function. Receives the raw request and the shared logger and
 * returns the response body; a value without `success`/`error` is wrapped as
 * `{ success: true, data }` (except for mutation actions, which get it as
 * is), and `retryable: true` makes event and cron deliveries answer 503 so
 * Hasura retries.
 * @typedef {(req: import('express').Request, logger: import('winston').Logger) => Promise<any>} Handler
 */

export {};
