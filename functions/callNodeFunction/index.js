import winston from "winston";
import createCertificate from "./createCertificate/index.js";
import getSignedUrl from "./getSignedUrl/index.js";
import saveFile from "./saveFile/index.js";
import saveImage from "./saveImage/index.js";
import anonymizeUser from "./anonymizeUser/index.js";
import updateKeycloakUser from "./updateKeycloakUser/index.js";
import updateAdminUser from "./updateAdminUser/index.js";
import getAdminUsers from "./getAdminUsers/index.js";

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
  getAdminUsers
};

/**
 * Validates the Hasura secret from the request headers.
 * @param {string} hasuraSecret - The secret from request headers
 * @returns {Object} Validation result
 */
const validateSecret = (hasuraSecret) => {
  const hasuraCloudFunctionSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  
  if (hasuraSecret !== hasuraCloudFunctionSecret) {
    return {
      isValid: false,
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
 * Standardizes the response format by ensuring success flag is present.
 * @param {*} result - The function result
 * @returns {StandardResponse} Standardized response
 */
const formatResponse = (result) => {
  // If result already has success/messageKey properties, return it directly
  if (result && typeof result === 'object' && 'success' in result && 'messageKey' in result) {
    return result;
  }
  
  // Add standard fields for normal responses
  return {
    success: true,
    messageKey: "OPERATION_SUCCESS",
    result  // Instead of data, use result for consistency
  };
};

/**
 * Responds to any HTTP request from Hasura.
 * @param {express.Request} req - HTTP request context
 * @param {express.Response} res - HTTP response context
 */
export const callNodeFunction = async (req, res) => {
  const functionName = req.headers.name;
  
  logger.info(`Received request for function: ${functionName}`, {
    headers: req.headers,
    body: req.body
  });

  // Validate secret
  const secretValidation = validateSecret(req.headers.secret);
  if (!secretValidation.isValid) {
    return res.status(200).json(secretValidation.error);
  }

  // Validate function exists
  if (!(functionName in functionMap)) {
    return res.status(200).json({
      success: false,
      error: "Function Not Found",
      messageKey: "FUNCTION_NOT_FOUND"
    });
  }

  try {
    logger.info(`Executing function: ${functionName}`);
    const result = await functionMap[functionName](req);
    const formattedResponse = formatResponse(result);
    
    logger.info(`Successfully executed function: ${functionName}`, {
      response: formattedResponse
    });
    
    return res.status(200).json(formattedResponse);
    
  } catch (error) {
    logger.error(`Error in ${functionName}`, {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(200).json({
      success: false,
      error: error.message || "Internal Server Error",
      messageKey: error.messageKey || "INTERNAL_SERVER_ERROR",
      details: error.details || "An unexpected error occurred"
    });
  }
};
