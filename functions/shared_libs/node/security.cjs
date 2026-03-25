const crypto = require("crypto");

/**
 * Constant-time secret comparison that avoids early length-based exits.
 * Inputs are normalized via SHA-256 first, then compared with timingSafeEqual.
 */
function constantTimeSecretsEqual(providedSecret, expectedSecret) {
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

function secretsMatch(providedSecret, expectedSecret) {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  return constantTimeSecretsEqual(providedSecret, expectedSecret);
}

module.exports = {
  secretsMatch,
  constantTimeSecretsEqual,
};
