import { createRequire } from "node:module";
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
import createEnrollmentWithAddons from "./createEnrollmentWithAddons/index.js";
import syncGhostNewsletterSubscription from "./syncGhostNewsletterSubscription/index.js";
import createMatrixRoom from "./createMatrixRoom/index.js";
import updateMatrixInstructorPowerLevel from "./updateMatrixInstructorPowerLevel/index.js";
import syncProgramInstructorMatrixRoom from "./syncProgramInstructorMatrixRoom/index.js";
import copyProjectFromTemplate from "./copyProjectFromTemplate/index.js";
import setProjectDocumentationInstructionDefault from "./setProjectDocumentationInstructionDefault/index.js";
import deleteProjectDocumentationInstruction from "./deleteProjectDocumentationInstruction/index.js";

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
  createEnrollmentWithAddons,
  createMatrixRoom,
  updateMatrixInstructorPowerLevel,
  syncProgramInstructorMatrixRoom,
  syncGhostNewsletterSubscription,
  copyProjectFromTemplate,
  setProjectDocumentationInstructionDefault,
  deleteProjectDocumentationInstruction,
};

export const callNodeFunction = async (req, res) => {
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

    if (req.body.request_query?.includes("mutation")) {
      return res.status(200).json(result);
    }

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

    if (req.body.request_query?.includes("mutation")) {
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
      details: error.details || "An unexpected error occurred",
    });
  }
};
