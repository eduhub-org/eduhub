import { GraphQLClient } from 'graphql-request';
import { ORG_ADMIN_ROLES, isOrgAdminOfCourse } from '../lib/orgAdminScope.js';
import {
  FormbricksResponsesError,
  formattedResponsesForEnrollment,
  loadFormbricksSurveyResponses,
  storeQuestionnaireResponse,
  toStoredQuestionnaireResponse,
} from '../lib/formbricksResponses.js';

const GET_ENROLLMENT = `
  query GetEnrollmentForQuestionnaire($id: Int!) {
    CourseEnrollment_by_pk(id: $id) {
      id
      userId
      courseId
    }
  }
`;

const adminClient = () =>
  new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });

/**
 * Stores the newest response on the enrollment so the applications tab can show it
 * without asking Formbricks again. Only when the enrollment really is the requested
 * user's enrollment in the requested course. Failures are logged, never returned.
 */
async function persistNewestResponse(loaded, formattedResponses, { courseId, userId, enrollmentId }, logger) {
  if (!enrollmentId || formattedResponses.length === 0) return;
  try {
    const client = adminClient();
    const { CourseEnrollment_by_pk: enrollment } = await client.request(GET_ENROLLMENT, { id: Number(enrollmentId) });
    if (!enrollment || enrollment.userId !== String(userId) || enrollment.courseId !== Number(courseId)) {
      logger.warn('Not storing Formbricks response: enrollment does not match the request', { enrollmentId, courseId });
      return;
    }
    await storeQuestionnaireResponse(
      client,
      enrollmentId,
      toStoredQuestionnaireResponse(loaded, formattedResponses[0])
    );
    logger.info('Stored Formbricks response on enrollment', { enrollmentId });
  } catch (error) {
    logger.error('Failed to store Formbricks response on enrollment', { enrollmentId, error: error.message });
  }
}

/**
 * Fetches Formbricks survey responses for a specific enrollment.
 * Uses hidden fields to correlate responses with EduHub data, and stores the newest
 * matching response in CourseEnrollment.questionnaireResponse.
 *
 * @param {Object} req - Request object containing body with courseId, userId, enrollmentId, formbricksSurveyUrl
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Formbricks response data or error
 */
export default async function getFormbricksResponses(req, logger) {
  logger.info("########## Get Formbricks Responses ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { courseId, userId, enrollmentId, formbricksSurveyUrl } = req.body.input || req.body;
    
    logger.info('Fetching Formbricks responses', { courseId, userId, enrollmentId, formbricksSurveyUrl });
    
    // Validate required inputs
    if (!formbricksSurveyUrl) {
      return {
        success: true,
        responses: [],
        survey: null,
        message: 'No Formbricks survey configured for this course'
      };
    }
    
    if (!courseId || !userId) {
      return {
        success: false,
        error: 'Missing required parameters: courseId and userId are required',
        messageKey: 'MISSING_PARAMETERS'
      };
    }

    // An org admin only for the courses they may manage (course management page).
    // The handler predates role checks for instructors; this does not add one for them.
    const sessionVariables = req.body?.session_variables || {};
    if (ORG_ADMIN_ROLES.has(sessionVariables['x-hasura-role'])) {
      if (!(await isOrgAdminOfCourse(adminClient(), sessionVariables['x-hasura-user-id'], Number(courseId)))) {
        return {
          success: false,
          error: 'Not allowed to read the responses of this course',
          messageKey: 'UNAUTHORIZED'
        };
      }
    }

    const loaded = await loadFormbricksSurveyResponses(formbricksSurveyUrl, logger);
    const formattedResponses = formattedResponsesForEnrollment(loaded, { userId, courseId, enrollmentId });

    logger.info('Successfully fetched Formbricks responses', {
      count: formattedResponses.length,
      totalChecked: loaded.responses.length,
      surveyId: loaded.survey.id
    });

    await persistNewestResponse(loaded, formattedResponses, { courseId, userId, enrollmentId }, logger);

    return {
      success: true,
      responses: formattedResponses,
      survey: loaded.survey
    };
    
  } catch (error) {
    if (error instanceof FormbricksResponsesError) {
      logger.error(error.message, { messageKey: error.messageKey });
      return { success: false, error: error.message, messageKey: error.messageKey };
    }

    logger.error('Error fetching Formbricks responses', { 
      error: error.message,
      stack: error.stack 
    });
    
    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'FORMBRICKS_FETCH_ERROR'
    };
  }
}
