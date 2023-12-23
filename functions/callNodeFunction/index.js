import createCertificate from "./createCertificate/index.js";
import saveAchievementDocumentationTemplate from "./saveAchievementDocumentationTemplate/index.js";
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
    // winston.format.timestamp(),
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
  try {
    if (process.env.HASURA_CLOUD_FUNCTION_SECRET != req.headers.secret) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    switch (req.headers.name) {
      case "createCertificate":
        logger.info("Calling createCertificate function");
        await createCertificate(req, res);
        break;
      case "saveAchievementDocumentationTemplate":
        logger.info("Calling saveAchievementDocumentationTemplate function");
        await saveAchievementDocumentationTemplate(req, res);
        break;
      default:
        return res.status(404).json({
          error: "Function Not Found",
        });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export default logger;
