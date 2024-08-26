import createCertificate from "./createCertificate/index.js";
import getSignedUrl from "./getSignedUrl/index.js";
import saveFile from "./saveFile/index.js";
import saveImage from "./saveImage/index.js";
import anonymizeUser from "./anonymizeUser/index.js";
import winston from "winston";

/**
 * Creates a logger instance.
 *
 * @module logger
 * @type {Object}
 * @property {Function} info Logs an info message.
 * @property {Function} debug Logs a debug message.
 * @property {Function} error Logs an error message.
 */
const logger = winston.createLogger({
  level: process.env.ENVIRONMENT === "production" ? "info" : "debug",
  format: winston.format.combine(
    // winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export const callNodeFunction = async (req, res) => {
  const hasuraSecret = req.headers.secret;
  const hasuraCloudFunctionSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  const functionName = req.headers.name;

  // Check if the provided secret matches the environment secret
  if (hasuraSecret !== hasuraCloudFunctionSecret) {
    return res.status(403).json({
      error: "Invalid secret provided.",
    });
  }

  try {
    logger.info(`Calling ${functionName} function`);
    let result;
    switch (functionName) {
      case "createCertificate":
        await createCertificate(req, res, logger);
        break;
      case "getSignedUrl":
        await getSignedUrl(req, res, logger);
        break;
      case "saveFile":
        await saveFile(req, res, logger);
        break;
      case "saveImage":
        await saveImage(req, res, logger);
        break;
      case "anonymizeUser":
        const { status, result } = await anonymizeUser(req, logger);
        return res.status(status).json(result);
      default:
        return res.status(404).json({
          error: "Function Not Found",
        });
    }
  } catch (error) {
    logger.error(`Error in ${functionName}: ${error.message}`);
    if (error.status && typeof error.status === 'number') {
      return res.status(error.status).json({
        error: error.message,
        details: error.details || "No additional details provided"
      });
    } else {
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        details: "An unexpected error occurred"
      });
    }
  }
};
export default logger;
