// @ts-check
import getSignedUrl from "./getSignedUrl/index.js";
import saveFile from "./saveFile/index.js";
import saveImage from "./saveImage/index.js";
import anonymizeUser, { deleteMyAccount } from "./anonymizeUser/index.js";
import updateKeycloakUser from "./updateKeycloakUser/index.js";
import updateAdminUser from "./updateAdminUser/index.js";
import getAdminUsers from "./getAdminUsers/index.js";
import sendEnrollmentEmail from "./sendEnrollmentEmail/index.js";
import sendOrganizerAddedEmail from "./sendOrganizerAddedEmail/index.js";
import sendInstructorCertificateEmail from "./sendInstructorCertificateEmail/index.js";
import sendSpeakerAddedEmail from "./sendSpeakerAddedEmail/index.js";
import sendCancellationRequestEmail from "./sendCancellationRequestEmail/index.js";
import sendSessionReminders from "./sendSessionReminders/index.js";
import makeCertificatePublic from "./makeCertificatePublic/index.js";
import createUser from "./createUser/index.js";
import getFormbricksResponses from "./getFormbricksResponses/index.js";
import syncFormbricksResponses from "./syncFormbricksResponses/index.js";
import getFormbricksAddonSelections from "./getFormbricksAddonSelections/index.js";
import validateFormbricksSurvey from "./validateFormbricksSurvey/index.js";
import saveCourseFormbricksEnrollmentSurvey from "./saveCourseFormbricksEnrollmentSurvey/index.js";
import createStripeCheckout from "./createStripeCheckout/index.js";
import createStripeBasePrice from "./createStripeBasePrice/index.js";
import createStripeAddonPrices from "./createStripeAddonPrices/index.js";
import createStripeJobPostingPrices from "./createStripeJobPostingPrices/index.js";
import publishJobPosting from "./publishJobPosting/index.js";
import sendPendingJobPostingMails from "./sendPendingJobPostingMails/index.js";
import archiveJobPosting from "./archiveJobPosting/index.js";
import setJobPostingActive from "./setJobPostingActive/index.js";
import claimJobOrganization from "./claimJobOrganization/index.js";
import requestJobOrganizationAccess from "./requestJobOrganizationAccess/index.js";
import saveOrganizationLogo from "./saveOrganizationLogo/index.js";
import removeOrganizationLogo from "./removeOrganizationLogo/index.js";
import updateOrganizationWebsite from "./updateOrganizationWebsite/index.js";
import createEnrollmentWithAddons from "./createEnrollmentWithAddons/index.js";
import syncGhostNewsletterSubscription from "./syncGhostNewsletterSubscription/index.js";
import createMatrixRoom from "./createMatrixRoom/index.js";
import updateMatrixInstructorPowerLevel from "./updateMatrixInstructorPowerLevel/index.js";
import syncProgramInstructorMatrixRoom from "./syncProgramInstructorMatrixRoom/index.js";
import copyProjectFromTemplate from "./copyProjectFromTemplate/index.js";
import setProjectDocumentationInstructionDefault from "./setProjectDocumentationInstructionDefault/index.js";
import deleteProjectDocumentationInstruction from "./deleteProjectDocumentationInstruction/index.js";
import saveProjectDocumentationInstruction from "./saveProjectDocumentationInstruction/index.js";
import sendProjectEmail from "./sendProjectEmail/index.js";
import sendCourseUpdateEmail from "./sendCourseUpdateEmail/index.js";
import notifySessionParticipants from "./notifySessionParticipants/index.js";
import registerGuestForCourse from "./registerGuestForCourse/index.js";
import confirmGuestRegistration from "./confirmGuestRegistration/index.js";
import manageGuestRegistration from "./manageGuestRegistration/index.js";
import manageTestEnrollment from "./manageTestEnrollment/index.js";
import syncRausgegangenEvent from "./syncRausgegangenEvent/index.js";
import searchRausgegangenLocations from "./searchRausgegangenLocations/index.js";
import geocodeLocationAddress from "./geocodeLocationAddress/index.js";
import { createDispatcher } from "./lib/dispatcher.js";

/**
 * Handlers by the `Function-Name` (legacy: `name`) header Hasura sends. Static imports on purpose: the
 * Cloud Functions entry point must be resolvable without scanning folders.
 * __tests__/registry.test.js checks this map against the handler folders and
 * the Hasura metadata.
 * @type {Record<string, import('./lib/types.js').Handler>}
 */
export const functionMap = {
  getSignedUrl,
  saveFile,
  saveImage,
  anonymizeUser,
  deleteMyAccount,
  updateKeycloakUser,
  updateAdminUser,
  getAdminUsers,
  sendEnrollmentEmail,
  sendOrganizerAddedEmail,
  sendInstructorCertificateEmail,
  sendSpeakerAddedEmail,
  sendCancellationRequestEmail,
  sendSessionReminders,
  makeCertificatePublic,
  createUser,
  getFormbricksResponses,
  syncFormbricksResponses,
  getFormbricksAddonSelections,
  validateFormbricksSurvey,
  saveCourseFormbricksEnrollmentSurvey,
  createStripeCheckout,
  createStripeBasePrice,
  createStripeAddonPrices,
  createStripeJobPostingPrices,
  publishJobPosting,
  sendPendingJobPostingMails,
  archiveJobPosting,
  setJobPostingActive,
  claimJobOrganization,
  requestJobOrganizationAccess,
  saveOrganizationLogo,
  removeOrganizationLogo,
  updateOrganizationWebsite,
  createEnrollmentWithAddons,
  createMatrixRoom,
  updateMatrixInstructorPowerLevel,
  syncProgramInstructorMatrixRoom,
  syncGhostNewsletterSubscription,
  copyProjectFromTemplate,
  setProjectDocumentationInstructionDefault,
  deleteProjectDocumentationInstruction,
  saveProjectDocumentationInstruction,
  sendProjectEmail,
  sendCourseUpdateEmail,
  notifySessionParticipants,
  registerGuestForCourse,
  confirmGuestRegistration,
  manageGuestRegistration,
  manageTestEnrollment,
  syncRausgegangenEvent,
  searchRausgegangenLocations,
  geocodeLocationAddress,
};

/**
 * Responds to any HTTP request from Hasura; see lib/dispatcher.js for the
 * request contract.
 */
export const callNodeFunction = createDispatcher({ name: "callNodeFunction", handlers: functionMap });
