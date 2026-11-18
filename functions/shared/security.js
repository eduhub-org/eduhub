import crypto from "node:crypto";

/**
 * Constant-time secret comparison that avoids early length-based exits.
 * Inputs are normalized via SHA-256 first, then compared with timingSafeEqual.
 */
export function constantTimeSecretsEqual(providedSecret, expectedSecret) {
  const provided = String(providedSecret ?? "");
  const expected = String(expectedSecret ?? "");

  const providedDigest = crypto
    .createHash("sha256")
    .update(Buffer.from(provided, "utf8"))
    .digest();
  const expectedDigest = crypto
    .createHash("sha256")
    .update(Buffer.from(expected, "utf8"))
    .digest();

  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

export function secretsMatch(providedSecret, expectedSecret) {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  return constantTimeSecretsEqual(providedSecret, expectedSecret);
}

/**
 * Header that carries HASURA_CLOUD_FUNCTION_SECRET (`Hasura-Secret`), and the
 * legacy name still sent by most Hasura metadata until the switch in
 * docs/plans/functions-header-switch.md. Node lowercases incoming header
 * names, so these are the keys of `req.headers`.
 */
export const SECRET_HEADER = "hasura-secret";
export const LEGACY_SECRET_HEADER = "secret";

/**
 * The secret a request carries: `Hasura-Secret`, else the legacy `secret`.
 * @param {Record<string, string | string[] | undefined> | undefined} headers
 *   `req.headers` (lowercase keys)
 * @returns {string | string[] | undefined}
 */
export function getProvidedSecret(headers) {
  return headers?.[SECRET_HEADER] ?? headers?.[LEGACY_SECRET_HEADER];
}
