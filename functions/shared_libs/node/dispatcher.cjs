"use strict";
let winston = null;
try {
  winston = require("winston");
} catch {
  // winston not available in this resolution context (shared_libs dev path);
  // callers receive a console-backed logger when running outside a function package.
}
const { constantTimeSecretsEqual } = require("./security.cjs");

function createDispatcherLogger() {
  if (winston) {
    return winston.createLogger({
      level: process.env.ENVIRONMENT === "production" ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
      ],
    });
  }
  return {
    info: (...a) => console.log("[INFO]", ...a),
    debug: (...a) => console.debug("[DEBUG]", ...a),
    warn: (...a) => console.warn("[WARN]", ...a),
    error: (...a) => console.error("[ERROR]", ...a),
  };
}

function validateSecret(hasuraSecret) {
  const hasuraCloudFunctionSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (
    !hasuraCloudFunctionSecret ||
    typeof hasuraCloudFunctionSecret !== "string" ||
    hasuraCloudFunctionSecret.trim() === ""
  ) {
    return {
      isValid: false,
      statusCode: 500,
      error: { success: false, error: "Server secret is not configured.", messageKey: "SERVER_MISCONFIGURED" },
    };
  }
  if (!hasuraSecret || typeof hasuraSecret !== "string") {
    return {
      isValid: false,
      statusCode: 401,
      error: { success: false, error: "Missing secret header.", messageKey: "MISSING_SECRET" },
    };
  }
  if (!constantTimeSecretsEqual(hasuraSecret, hasuraCloudFunctionSecret)) {
    return {
      isValid: false,
      statusCode: 401,
      error: { success: false, error: "Invalid secret provided.", messageKey: "INVALID_SECRET" },
    };
  }
  return { isValid: true };
}

function formatResponse(result) {
  if (result && typeof result === "object" && ("success" in result || "error" in result)) {
    return result;
  }
  return { success: true, data: result };
}

function redactForLogging(response) {
  if (!response || typeof response !== "object") return { type: typeof response };
  const summary = { success: response.success, messageKey: response.messageKey };
  if (response.enrollmentId) summary.hasEnrollmentId = true;
  if (response.checkoutUrl) summary.hasCheckoutUrl = true;
  if (response.link) summary.hasLink = true;
  if (response.filePath) summary.hasFilePath = true;
  if (response.accessUrl) summary.hasAccessUrl = true;
  if (response.sessionId) summary.hasSessionId = true;
  if (response.selectedAddons) summary.addonCount = response.selectedAddons.length;
  return summary;
}

module.exports = { createDispatcherLogger, validateSecret, formatResponse, redactForLogging };
