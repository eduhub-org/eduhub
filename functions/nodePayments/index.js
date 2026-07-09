import { createRequire } from "node:module";
import createStripeCheckout from "./createStripeCheckout/index.js";
import createStripeBasePrice from "./createStripeBasePrice/index.js";
import createStripeAddonPrices from "./createStripeAddonPrices/index.js";

const require = createRequire(import.meta.url);
let validateSecret, createDispatcherLogger, formatResponse, redactForLogging;
try {
  ({ validateSecret, createDispatcherLogger, formatResponse, redactForLogging } =
    require("./shared_libs/node/dispatcher.cjs"));
} catch {
  ({ validateSecret, createDispatcherLogger, formatResponse, redactForLogging } =
    require("../shared_libs/node/dispatcher.cjs"));
}

export const logger = createDispatcherLogger();

const functionMap = {
  createStripeCheckout,
  createStripeBasePrice,
  createStripeAddonPrices,
};

export const nodePayments = async (req, res) => {
  const functionName = req.headers.name;

  const secretValidation = validateSecret(req.headers.secret);
  if (!secretValidation.isValid) {
    return res.status(secretValidation.statusCode).json(secretValidation.error);
  }

  logger.info(`Received request for function: ${functionName}`);

  if (!(functionName in functionMap)) {
    return res.status(404).json({
      success: false,
      error: "Function Not Found",
      messageKey: "FUNCTION_NOT_FOUND",
    });
  }

  try {
    logger.info(`Executing function: ${functionName}`);
    const result = await functionMap[functionName](req, logger);
    const formattedResponse = formatResponse(result);
    logger.info(`Successfully executed function: ${functionName}`, {
      response: redactForLogging(formattedResponse),
    });
    return res.status(200).json(formattedResponse);
  } catch (error) {
    logger.error(`Error in ${functionName}`, {
      error: error.message,
      stack: error.stack,
    });
    return res.status(200).json({
      success: false,
      error: error.message || "Internal Server Error",
      messageKey: error.messageKey || "INTERNAL_SERVER_ERROR",
      details: error.details || "An unexpected error occurred",
    });
  }
};
