const DEFAULT_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A GraphQL error means the request itself was rejected (bad query, permission
 * denied) — retrying sends the same broken request again. Everything else
 * (socket hang-ups, timeouts, 5xx from Hasura) is worth another attempt.
 */
const isRetriable = (error) => !error?.response?.errors?.length;

/**
 * Runs an async operation with exponential backoff.
 *
 * The event-trigger router always answers Hasura with HTTP 200, so Hasura's own
 * retry_conf never fires for logical failures: a transient read error would
 * silently drop the email. Retrying here is what keeps that from happening.
 *
 * @param {Function} operation - async function to run; receives the attempt number (1-based)
 * @param {Object} [options]
 * @param {number} [options.attempts=3] - total attempts, including the first
 * @param {Object} [options.logger] - logger used to report retries
 * @param {string} [options.description] - what is being retried, for log messages
 * @returns {Promise<*>} whatever `operation` resolves to
 * @throws the last error when every attempt failed
 */
export async function withRetry(operation, { attempts = DEFAULT_ATTEMPTS, logger, description = 'operation' } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (!isRetriable(error) || attempt === attempts) {
        break;
      }

      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      logger?.warn?.(
        `Retrying ${description} (attempt ${attempt + 1}/${attempts}) after ${backoff}ms: ${error.message}`
      );
      await sleep(backoff);
    }
  }

  throw lastError;
}
