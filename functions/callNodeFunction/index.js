import winston from "winston";
import { createRequire } from "node:module";
import createCertificate from "./createCertificate/index.js";
import getSignedUrl from "./getSignedUrl/index.js";
import saveFile from "./saveFile/index.js";
import saveImage from "./saveImage/index.js";
import anonymizeUser from "./anonymizeUser/index.js";
import updateKeycloakUser from "./updateKeycloakUser/index.js";
import updateAdminUser from "./updateAdminUser/index.js";
import getAdminUsers from "./getAdminUsers/index.js";
import sendEnrollmentEmail from "./sendEnrollmentEmail/index.js";
import sendOrganizerAddedEmail from "./sendOrganizerAddedEmail/index.js";
import sendSessionReminders from "./sendSessionReminders/index.js";
import makeCertificatePublic from "./makeCertificatePublic/index.js";
import createUser from "./createUser/index.js";
import getFormbricksResponses from "./getFormbricksResponses/index.js";
import getFormbricksAddonSelections from "./getFormbricksAddonSelections/index.js";
import validateFormbricksSurvey from "./validateFormbricksSurvey/index.js";
import saveCourseFormbricksEnrollmentSurvey from "./saveCourseFormbricksEnrollmentSurvey/index.js";
import createStripeCheckout from "./createStripeCheckout/index.js";
import createStripeBasePrice from "./createStripeBasePrice/index.js";
import createStripeAddonPrices from "./createStripeAddonPrices/index.js";
import createStripeJobPostingPrices from "./createStripeJobPostingPrices/index.js";
import publishJobPosting from "./publishJobPosting/index.js";
import archiveJobPosting from "./archiveJobPosting/index.js";
import createEnrollmentWithAddons from "./createEnrollmentWithAddons/index.js";
import syncGhostNewsletterSubscription from "./syncGhostNewsletterSubscription/index.js";
import createMatrixRoom from "./createMatrixRoom/index.js";
import updateMatrixInstructorPowerLevel from "./updateMatrixInstructorPowerLevel/index.js";
import syncProgramInstructorMatrixRoom from "./syncProgramInstructorMatrixRoom/index.js";
import copyProjectFromTemplate from "./copyProjectFromTemplate/index.js";
import setProjectDocumentationInstructionDefault from "./setProjectDocumentationInstructionDefault/index.js";
import deleteProjectDocumentationInstruction from "./deleteProjectDocumentationInstruction/index.js";

const require = createRequire(import.meta.url);
let constantTimeSecretsEqual;
try {
  ({ constantTimeSecretsEqual } = require("./shared_libs/node/security.cjs"));
} catch {
  ({ constantTimeSecretsEqual } = require("../shared_libs/node/security.cjs"));
}

/**
 * Creates a logger instance with structured logging.
 */
export const logger = winston.createLogger({
  level: process.env.ENVIRONMENT === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()  // Changed to JSON format for better structured logging
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const functionMap = {
  createCertificate,
  getSignedUrl,
  saveFile,
  saveImage,
  anonymizeUser,
  updateKeycloakUser,
  updateAdminUser,
  getAdminUsers,
  sendEnrollmentEmail,
  sendOrganizerAddedEmail,
  sendSessionReminders,
  makeCertificatePublic,
  createUser,
  getFormbricksResponses,
  getFormbricksAddonSelections,
  validateFormbricksSurvey,
  saveCourseFormbricksEnrollmentSurvey,
  createStripeCheckout,
  createStripeBasePrice,
  createStripeAddonPrices,
  createStripeJobPostingPrices,
  publishJobPosting,
  archiveJobPosting,
  createEnrollmentWithAddons,
  createMatrixRoom,
  updateMatrixInstructorPowerLevel,
  syncProgramInstructorMatrixRoom,
  syncGhostNewsletterSubscription,
  copyProjectFromTemplate,
  setProjectDocumentationInstructionDefault,
  deleteProjectDocumentationInstruction,
};

const constantTimeEquals = (providedSecret, expectedSecret) => {
  return constantTimeSecretsEqual(providedSecret, expectedSecret);
};

/**
 * Validates the Hasura secret from the request headers.
 * @param {string} hasuraSecret - The secret from request headers
 * @returns {Object} Validation result
 */
const validateSecret = (hasuraSecret) => {
  const hasuraCloudFunctionSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;

  if (!hasuraCloudFunctionSecret || typeof hasuraCloudFunctionSecret !== "string" || hasuraCloudFunctionSecret.trim() === "") {
    return {
      isValid: false,
      statusCode: 500,
      error: {
        success: false,
        error: "Server secret is not configured.",
        messageKey: "SERVER_MISCONFIGURED"
      }
    };
  }

  if (!hasuraSecret || typeof hasuraSecret !== "string") {
    return {
      isValid: false,
      statusCode: 401,
      error: {
        success: false,
        error: "Missing secret header.",
        messageKey: "MISSING_SECRET"
      }
    };
  }

  if (!constantTimeEquals(hasuraSecret, hasuraCloudFunctionSecret)) {
    return {
      isValid: false,
      statusCode: 401,
      error: {
        success: false,
        error: "Invalid secret provided.",
        messageKey: "INVALID_SECRET"
      }
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
 * Responds to any HTTP request from Hasura.
 * @param {express.Request} req - HTTP request context
 * @param {express.Response} res - HTTP response context
 */
export const callNodeFunction = async (req, res) => {
  const functionName = req.headers.name;

  // Validate secret
  const secretValidation = validateSecret(req.headers.secret);
  if (!secretValidation.isValid) {
    return res.status(secretValidation.statusCode).json(secretValidation.error);
  }

  logger.info(`Received request for function: ${functionName}`);

  // Validate function exists
  if (!(functionName in functionMap)) {
    return res.status(404).json({
      success: false,
      error: "Function Not Found",
      messageKey: "FUNCTION_NOT_FOUND"
    });
  }

  try {
    logger.info(`Executing function: ${functionName}`);
    const result = await functionMap[functionName](req, logger);
    

    if (req.body.request_query?.includes('mutation')) {
      return res.status(200).json(result);
    }
    
    // Define formattedResponse with the output from formatResponse.
    const formattedResponse = formatResponse(result);
    
    logger.info(`Successfully executed function: ${functionName}`, {
      response: redactForLogging(formattedResponse)
    });
    
    return res.status(200).json(formattedResponse);
    
  } catch (error) {
    logger.error(`Error in ${functionName}`, {
      error: error.message,
      stack: error.stack
    });
    

    if (req.body.request_query?.includes('mutation')) {
      return res.status(200).json({
        success: false,
        error: error.message || "Internal Server Error",
        messageKey: error.messageKey || "INTERNAL_SERVER_ERROR",
      });
    }
    
  
    return res.status(200).json({
      success: false,
      error: error.message || "Internal Server Error",
      messageKey: error.messageKey || "INTERNAL_SERVER_ERROR",
      details: error.details || "An unexpected error occurred"
    });
  }
};
