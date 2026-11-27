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
import updateFromKeycloak from "./updateFromKeycloak/index.js";
import addKeycloakRole from "./addKeycloakRole/index.js";
import removeKeycloakRole from "./removeKeycloakRole/index.js";
import sendQuestionaires from "./sendQuestionaires/index.js";
import syncExpertEmbeddings from "./syncExpertEmbeddings/index.js";
import semanticExpertSearch from "./semanticExpertSearch/index.js";
import semanticProjectSearch from "./semanticProjectSearch/index.js";
import searchKnowledge from "./searchKnowledge/index.js";
import generateIssueReportSummary from "./generateIssueReportSummary/index.js";
import reconcileIssueReportsWithGithub from "./reconcileIssueReportsWithGithub/index.js";
import { createDispatcher } from "./lib/dispatcher.js";

// Handlers by the `Function-Name` (legacy: `name`) header Hasura sends, one map
// per unit. Static imports on purpose: a Cloud Functions entry point must be
// resolvable without scanning folders. __tests__/registry.test.js checks the
// maps against the handler folders and the Hasura metadata.
//
// All three units deploy this same code (callNodeFunction.zip) with a
// different entry point; what separates them is the secrets Terraform gives
// each one (docs/adr/0002-function-units-by-secret-scope.md). Put a handler in
// the unit that holds the credentials it needs.

/**
 * Keycloak and Matrix accounts: everything that needs the Keycloak admin
 * login or a Matrix token.
 * @type {Record<string, import('./lib/types.js').Handler>}
 */
export const identityHandlers = {
  createUser,
  updateKeycloakUser,
  updateAdminUser,
  getAdminUsers,
  claimJobOrganization,
  anonymizeUser,
  deleteMyAccount,
  createMatrixRoom,
  syncProgramInstructorMatrixRoom,
  updateMatrixInstructorPowerLevel,
  updateFromKeycloak,
  addKeycloakRole,
  removeKeycloakRole,
};

/**
 * Identity actions whose handler follows the action name instead of the
 * routing header, because the action forwards client headers (see
 * pinnedActions in lib/dispatcher.js).
 * @type {Record<string, string>}
 */
export const identityPinnedActions = {
  updateFromKeycloak: "updateFromKeycloak",
};

/**
 * Files in the storage bucket: uploads, image resizing, signed URLs. Hasura
 * and storage only, with more memory for sharp.
 * @type {Record<string, import('./lib/types.js').Handler>}
 */
export const mediaHandlers = {
  saveFile,
  saveImage,
  saveOrganizationLogo,
  removeOrganizationLogo,
  getSignedUrl,
  makeCertificatePublic,
};

/**
 * Everything else: enrollment, guest registration, Formbricks, Stripe, job
 * postings, mails and syncs.
 * @type {Record<string, import('./lib/types.js').Handler>}
 */
export const callNodeFunctionHandlers = {
  sendEnrollmentEmail,
  sendOrganizerAddedEmail,
  sendInstructorCertificateEmail,
  sendSpeakerAddedEmail,
  sendCancellationRequestEmail,
  sendSessionReminders,
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
  requestJobOrganizationAccess,
  updateOrganizationWebsite,
  createEnrollmentWithAddons,
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
  sendQuestionaires,
  syncExpertEmbeddings,
  semanticExpertSearch,
  semanticProjectSearch,
  searchKnowledge,
  generateIssueReportSummary,
  reconcileIssueReportsWithGithub,
};

/**
 * Handlers that moved from callNodeFunction to identity or media and that
 * callNodeFunction still routes for one release, so a Hasura revision or an
 * event retry that still targets callNodeFunction's URL during the rollout
 * does not get a 404. Remove with
 * docs/plans/functions-topology-cleanup.md.
 * @type {Record<string, import('./lib/types.js').Handler>}
 */
export const movedHandlers = {
  createUser,
  updateKeycloakUser,
  updateAdminUser,
  getAdminUsers,
  claimJobOrganization,
  anonymizeUser,
  deleteMyAccount,
  createMatrixRoom,
  syncProgramInstructorMatrixRoom,
  updateMatrixInstructorPowerLevel,
  saveFile,
  saveImage,
  saveOrganizationLogo,
  removeOrganizationLogo,
  getSignedUrl,
  makeCertificatePublic,
};

/** Entry point of the callNodeFunction unit. */
export const callNodeFunction = createDispatcher({
  name: "callNodeFunction",
  handlers: { ...callNodeFunctionHandlers, ...movedHandlers },
});

/** Entry point of the identity unit (same zip as callNodeFunction). */
export const identity = createDispatcher({
  name: "identity",
  handlers: identityHandlers,
  pinnedActions: identityPinnedActions,
});

/** Entry point of the media unit (same zip as callNodeFunction). */
export const media = createDispatcher({ name: "media", handlers: mediaHandlers });
