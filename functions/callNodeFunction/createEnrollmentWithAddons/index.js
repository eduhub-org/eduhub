import { GraphQLClient } from 'graphql-request';
import { validateAndExtractFormbricksSurvey, buildLabelToChoiceIdMap, matchAddonsFromResponse, fetchAllFormbricksResponses } from '../lib/formbricks.js';

const normalizeUserId = (value) => String(value ?? '').trim().toLowerCase();

const GET_COURSE_ADDONS = `
  query GetCourseAddons($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      CourseAddonMappings {
        id
        questionId
        choiceId
        description
        validatedPrice
        currency
      }
    }
  }
`;

const CREATE_ENROLLMENT = `
  mutation CreateEnrollment(
    $courseId: Int!
    $userId: uuid!
    $motivationLetter: String!
    $status: CourseEnrollmentStatus_enum!
    $termsAcceptedAt: timestamptz
    $paymentStatus: PaymentStatus_enum
  ) {
    insert_CourseEnrollment(
      objects: {
        courseId: $courseId
        userId: $userId
        motivationLetter: $motivationLetter
        status: $status
        termsAcceptedAt: $termsAcceptedAt
        paymentStatus: $paymentStatus
      }
      on_conflict: {
        constraint: uniqueUserCourse
        update_columns: [status, termsAcceptedAt, motivationLetter, paymentStatus]
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

const GET_ENROLLMENT_ADDONS = `
  query GetEnrollmentAddons($enrollmentId: Int!) {
    CourseEnrollmentAddon(where: { enrollmentId: { _eq: $enrollmentId } }) {
      enrollmentId
      addonMappingId
      priceAtPurchase
      currency
    }
  }
`;

const DELETE_ENROLLMENT_ADDONS = `
  mutation DeleteEnrollmentAddons(
    $enrollmentId: Int!
  ) {
    delete_CourseEnrollmentAddon(
      where: { enrollmentId: { _eq: $enrollmentId } }
    ) {
      affected_rows
    }
  }
`;

const INSERT_ENROLLMENT_ADDONS = `
  mutation InsertEnrollmentAddons(
    $objects: [CourseEnrollmentAddon_insert_input!]!
  ) {
    insert_CourseEnrollmentAddon(objects: $objects) {
      affected_rows
      returning {
        id
        addonMappingId
        priceAtPurchase
        currency
      }
    }
  }
`;

/**
 * Fetches Formbricks responses with retry logic to handle timing issues.
 * Retries up to 5 times with 2 second delays if response is not yet finished.
 * 
 * @param {string} formbricksApiUrl - Base URL of Formbricks instance
 * @param {string} formbricksSurveyId - Survey ID
 * @param {string} formbricksApiKey - API key
 * @param {string} userId - User ID to filter responses
 * @param {number} courseId - Course ID to filter responses
 * @param {Object} logger - Winston logger instance
 * @param {number} maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} retryDelayMs - Delay between retries in milliseconds (default: 2000)
 * @returns {Promise<Object|null>} Latest matching response or null if not found
 */
async function fetchFormbricksResponseWithRetry(
  formbricksApiUrl,
  formbricksSurveyId,
  formbricksApiKey,
  userId,
  courseId,
  logger,
  maxRetries = 5,
  retryDelayMs = 2000
) {
  const normalizedUserId = normalizeUserId(userId);

  // Initial delay before first attempt - Formbricks needs time to persist the response
  // The survey completion event can fire before Formbricks has saved the response
  if (maxRetries > 0) {
    logger.debug('Waiting initial delay before fetching Formbricks responses', {
      initialDelayMs: retryDelayMs
    });
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Fetching Formbricks responses (attempt ${attempt}/${maxRetries})`, {
        userId: normalizedUserId,
        courseId: String(courseId)
      });

      let allResponses;
      try {
        allResponses = await fetchAllFormbricksResponses(
          formbricksApiUrl, formbricksSurveyId, formbricksApiKey, logger
        );
      } catch (fetchError) {
        logger.error(`Failed to fetch responses: ${fetchError.message}`);
        if (attempt === maxRetries) {
          throw fetchError;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      logger.info(`Formbricks API returned ${allResponses.length} total responses`, {
        attempt,
        surveyId: formbricksSurveyId,
        lookingFor: { userId: normalizedUserId, courseId: String(courseId) }
      });

      // Log first few responses for debugging - check both data and hiddenFields
      if (allResponses.length > 0) {
        logger.info('Sample responses from Formbricks (checking for hidden fields)', {
          sampleResponses: allResponses.slice(0, 5).map(r => ({
            id: r.id,
            finished: r.finished,
            createdAt: r.createdAt,
            dataKeys: Object.keys(r.data || {}),
            hasEduhubUserIdInData: !!r.data?.eduhubUserId,
            hasEduhubCourseIdInData: !!r.data?.eduhubCourseId,
            hasEduhubUserIdInHiddenFields: !!r.hiddenFields?.eduhubUserId,
            hasEduhubCourseIdInHiddenFields: !!r.hiddenFields?.eduhubCourseId,
            hasHiddenFieldsProperty: !!r.hiddenFields,
            dataEntryCount: Object.keys(r.data || {}).length
          }))
        });
      } else {
        logger.warn('No responses returned from Formbricks API', {
          attempt,
          surveyId: formbricksSurveyId,
          apiUrl: responsesUrl.toString()
        });
      }

      // Filter responses by userId and courseId (from hidden fields)
      // Hidden fields are merged into response.data when the response is created
      // They're only stored if configured in survey.hiddenFields.fieldIds
      const matchingResponses = allResponses.filter(response => {
        const responseData = response.data || {};
        
        // Check for hidden fields in data (they're merged in during response creation)
        // Also check if response has a separate hiddenFields property (for API compatibility)
        const responseUserId = responseData.eduhubUserId || response.hiddenFields?.eduhubUserId;
        const responseCourseId = responseData.eduhubCourseId || response.hiddenFields?.eduhubCourseId;
        const normalizedResponseUserId = normalizeUserId(responseUserId);
        
        const matchesUser = normalizedResponseUserId && normalizedResponseUserId === normalizedUserId;
        const matchesCourse = responseCourseId && String(responseCourseId) === String(courseId);
        
        logger.debug('Checking response match', {
          responseId: response.id,
          responseUserId: normalizedResponseUserId || 'undefined',
          expectedUserId: normalizedUserId,
          matchesUser,
          responseCourseId: responseCourseId ? String(responseCourseId) : 'undefined',
          expectedCourseId: String(courseId),
          matchesCourse,
          finished: response.finished,
          dataKeys: Object.keys(responseData),
          hasHiddenFields: !!response.hiddenFields
        });
        
        return matchesUser && matchesCourse;
      });

      logger.info(`Found ${matchingResponses.length} matching responses`, {
        attempt,
        finishedCount: matchingResponses.filter(r => r.finished === true).length,
        unfinishedCount: matchingResponses.filter(r => r.finished !== true).length,
        totalResponses: allResponses.length
      });

      if (matchingResponses.length === 0) {
        // Check if there are any responses with partial matches (for debugging)
        const partialMatches = allResponses.filter(response => {
          const responseData = response.data || {};
          const responseUserId = responseData.eduhubUserId || response.hiddenFields?.eduhubUserId;
          const responseCourseId = responseData.eduhubCourseId || response.hiddenFields?.eduhubCourseId;
          return (normalizeUserId(responseUserId) === normalizedUserId) || 
                 (responseCourseId && String(responseCourseId) === String(courseId));
        });

        if (attempt < maxRetries) {
          logger.warn(`No matching responses found (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`, {
            userId: String(userId),
            normalizedUserId,
            courseId: String(courseId),
            totalResponses: allResponses.length,
            partialMatches: partialMatches.length,
            sampleResponseIds: allResponses.slice(0, 3).map(r => r.id),
            note: 'Hidden fields must be configured in Formbricks survey settings (hiddenFields.fieldIds) to be stored'
          });
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        
        logger.error('No matching responses found after all retries', {
          userId: String(userId),
          normalizedUserId,
          courseId: String(courseId),
          totalResponses: allResponses.length,
          partialMatches: partialMatches.length,
          maxRetries,
          troubleshooting: {
            issue: 'Response not found - possible causes:',
            causes: [
              'Hidden fields (eduhubUserId, eduhubCourseId) not configured in Formbricks survey settings',
              'Response not yet saved to Formbricks (timing issue)',
              'Response created with different userId/courseId values',
              'Survey not completed/finished'
            ]
          }
        });
        return null;
      }

      // Sort by creation date (most recent first)
      matchingResponses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latestResponse = matchingResponses[0];

      // If we have a finished response, return it immediately
      if (latestResponse.finished === true) {
        logger.info('Found finished response', {
          responseId: latestResponse.id,
          attempt
        });
        return latestResponse;
      }

      // If this is not the last attempt, wait and retry for a finished response
      if (attempt < maxRetries) {
        logger.debug(`Latest response not finished yet, retrying in ${retryDelayMs}ms...`, {
          responseId: latestResponse.id
        });
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      // Last attempt: return unfinished response as fallback
      logger.warn('Using unfinished response as fallback (timing issue)', {
        responseId: latestResponse.id,
        attempt
      });
      return latestResponse;

    } catch (error) {
      logger.error(`Error fetching Formbricks responses (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        stack: error.stack
      });
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying on error
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  return null;
}

/**
 * Creates a course enrollment and saves selected addons from Formbricks survey to the database.
 * Handles Formbricks timing issues with retry logic.
 * 
 * @param {Object} req - Request object containing body with courseId, userId, motivationLetter, formbricksSurveyUrl, acceptTerms
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Result with success, enrollmentId, selectedAddons, or error
 */
export default async function createEnrollmentWithAddons(req, logger) {
  logger.info("########## Create Enrollment With Addons ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const {
      courseId,
      userId,
      motivationLetter,
      formbricksSurveyUrl,
      acceptTerms
    } = req.body.input || req.body;

    // Validate required inputs
    if (!courseId || !userId) {
      return {
        success: false,
        error: 'Missing required parameters: courseId and userId are required',
        messageKey: 'MISSING_PARAMETERS',
        enrollmentId: null,
        selectedAddons: []
      };
    }

    if (!sessionUserId) {
      return {
        success: false,
        error: 'Missing authenticated session user',
        messageKey: 'UNAUTHORIZED',
        enrollmentId: null,
        selectedAddons: []
      };
    }

    const normalizedInputUserId = normalizeUserId(userId);
    const normalizedSessionUserId = normalizeUserId(sessionUserId);

    if (!normalizedInputUserId || !normalizedSessionUserId || normalizedInputUserId !== normalizedSessionUserId) {
      return {
        success: false,
        error: 'User ID mismatch',
        messageKey: 'UNAUTHORIZED',
        enrollmentId: null,
        selectedAddons: []
      };
    }
    const effectiveUserId = normalizedSessionUserId;

    // Create Hasura GraphQL client
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    // Step 1: Create CourseEnrollment with status APPLIED and paymentStatus PENDING
    logger.info('Creating enrollment', { courseId, userId: effectiveUserId });
    
    // Set termsAcceptedAt server-side when acceptTerms is true (authoritative timestamp)
    const termsAcceptedAt = acceptTerms === true ? new Date().toISOString() : null;
    
    const enrollmentResult = await client.request(CREATE_ENROLLMENT, {
      courseId,
      userId: effectiveUserId,
      motivationLetter: motivationLetter || '[Formbricks Survey Completed]',
      status: 'APPLIED',
      termsAcceptedAt: termsAcceptedAt,
      paymentStatus: 'PENDING' // Set to PENDING for payment flows - will be updated by webhook on success/failure
    });

    const enrollmentId = enrollmentResult.insert_CourseEnrollment?.returning?.[0]?.id;

    if (!enrollmentId) {
      logger.error('Failed to create enrollment', { courseId, userId: effectiveUserId });
      return {
        success: false,
        error: 'Failed to create enrollment',
        messageKey: 'ENROLLMENT_CREATION_FAILED',
        enrollmentId: null,
        selectedAddons: []
      };
    }

    logger.info('Enrollment created successfully', { enrollmentId });

    // Step 2: Fetch addon selections from Formbricks (if survey URL provided)
    if (!formbricksSurveyUrl) {
      logger.info('No Formbricks survey URL provided, skipping addon selection');
      return {
        success: true,
        enrollmentId,
        selectedAddons: [],
        messageKey: 'NO_SURVEY_CONFIGURED'
      };
    }

    // Extract base URL and survey ID from the survey URL (with SSRF protection)
    const urlParts = validateAndExtractFormbricksSurvey(formbricksSurveyUrl, logger);
    if (!urlParts) {
      logger.error('Invalid Formbricks survey URL', { formbricksSurveyUrl });
      return {
        success: true,
        error: 'Enrollment created, but survey URL is invalid so no add-ons were processed.',
        messageKey: 'INVALID_SURVEY_URL',
        enrollmentId,
        selectedAddons: []
      };
    }

    const { baseUrl: formbricksApiUrl, surveyId: formbricksSurveyId } = urlParts;
    const formbricksApiKey = process.env.FORMBRICKS_API_KEY;

    if (!formbricksApiKey) {
      logger.error('Formbricks API key missing');
      return {
        success: true,
        error: 'Enrollment created, but Formbricks API key is missing so no add-ons were processed.',
        messageKey: 'FORMBRICKS_NOT_CONFIGURED',
        enrollmentId,
        selectedAddons: []
      };
    }

    // Fetch CourseAddonMappings from Hasura
    const courseData = await client.request(GET_COURSE_ADDONS, { courseId });
    const addonMappings = courseData.Course_by_pk?.CourseAddonMappings || [];

    if (addonMappings.length === 0) {
      logger.info('No addons configured for this course', { courseId });
      return {
        success: true,
        enrollmentId,
        selectedAddons: [],
        messageKey: 'NO_ADDONS_CONFIGURED'
      };
    }

    // Fetch survey structure to map labels to choice IDs (for multi-language support)
    let labelToChoiceIdMap = {};
    try {
      const surveyUrl = `${formbricksApiUrl}/api/v1/management/surveys/${formbricksSurveyId}`;
      logger.debug('Fetching survey structure for label-to-ID mapping', { surveyUrl });
      
      const surveyResponse = await fetch(surveyUrl, {
        method: 'GET',
        headers: {
          'x-api-key': formbricksApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (surveyResponse.ok) {
        const surveyData = await surveyResponse.json();
        const survey = surveyData.data || surveyData;
        labelToChoiceIdMap = buildLabelToChoiceIdMap(survey);
        
        logger.info('Built label-to-choice-ID mapping', {
          questionCount: Object.keys(labelToChoiceIdMap).length,
          totalMappings: Object.values(labelToChoiceIdMap).reduce((sum, map) => sum + Object.keys(map).length, 0),
          questionIds: Object.keys(labelToChoiceIdMap),
          fullMapping: JSON.stringify(labelToChoiceIdMap, null, 2),
          sampleMapping: Object.keys(labelToChoiceIdMap).length > 0 ? {
            questionId: Object.keys(labelToChoiceIdMap)[0],
            labelToId: labelToChoiceIdMap[Object.keys(labelToChoiceIdMap)[0]]
          } : null
        });
      } else {
        logger.error('Failed to fetch survey structure - choice ID matching will not work', {
          status: surveyResponse.status,
          note: 'CourseAddonMapping.choiceId must be a Formbricks choice ID. Without survey structure, matching will fail.'
        });
        // Return early if we can't fetch survey structure - matching won't work without it
        return {
          success: true,
          error: 'Enrollment created, but survey structure could not be fetched so no add-ons were processed.',
          messageKey: 'SURVEY_FETCH_FAILED',
          enrollmentId,
          selectedAddons: []
        };
      }
    } catch (error) {
      logger.error('Error fetching survey structure - choice ID matching will not work', {
        error: error.message,
        note: 'CourseAddonMapping.choiceId must be a Formbricks choice ID. Without survey structure, matching will fail.'
      });
      // Return early if we can't fetch survey structure - matching won't work without it
      return {
        success: true,
        error: 'Enrollment created, but survey structure retrieval failed so no add-ons were processed.',
        messageKey: 'SURVEY_FETCH_ERROR',
        enrollmentId,
        selectedAddons: []
      };
    }

    // Fetch Formbricks response with retry logic
    const latestResponse = await fetchFormbricksResponseWithRetry(
      formbricksApiUrl,
      formbricksSurveyId,
      formbricksApiKey,
      effectiveUserId,
      courseId,
      logger
    );

    if (!latestResponse) {
      logger.warn('No Formbricks response found for user/course after retries', { 
        userId: String(effectiveUserId), 
        courseId: String(courseId),
        surveyId: formbricksSurveyId,
        enrollmentId
      });
      // Still return success - enrollment was created, just no addons selected
      // This allows the user to proceed to payment even if addons couldn't be retrieved
      return {
        success: true,
        enrollmentId,
        selectedAddons: [],
        messageKey: 'NO_RESPONSES_FOUND',
        error: 'No Formbricks response found. Possible causes: 1) Hidden fields (eduhubUserId, eduhubCourseId) not configured in Formbricks survey settings, 2) Response not yet saved (timing issue), 3) Survey not completed. Enrollment created successfully - you can proceed without addons.'
      };
    }

    // Step 3: Match answers against CourseAddonMappings
    const responseData = latestResponse.data || {};
    
    logger.info('Starting addon matching', {
      enrollmentId,
      responseId: latestResponse.id,
      responseFinished: latestResponse.finished,
      responseDataKeys: Object.keys(responseData),
      responseDataSize: Object.keys(responseData).length,
      addonMappingsCount: addonMappings.length,
      hasLabelToIdMap: Object.keys(labelToChoiceIdMap).length > 0,
      labelToIdMapQuestionIds: Object.keys(labelToChoiceIdMap),
      addonMappingQuestionIds: addonMappings.map(m => m.questionId),
      fullLabelToIdMap: JSON.stringify(labelToChoiceIdMap, null, 2),
      addonMappingsSummary: JSON.stringify(addonMappings.map(m => ({ id: m.id, questionId: m.questionId, choiceId: m.choiceId })), null, 2)
    });

    const selectedAddons = matchAddonsFromResponse(responseData, addonMappings, labelToChoiceIdMap, logger);

    logger.info('Matched addons from Formbricks response', {
      enrollmentId,
      totalMappings: addonMappings.length,
      selectedCount: selectedAddons.length,
      selectedAddons: selectedAddons.map(a => ({ id: a.id, description: a.description }))
    });

    // Step 4: Delete existing addons (for re-enrollment scenarios) and insert new ones
    // Backup existing addons before delete so we can restore on insert failure
    let backupAddonObjects = [];
    try {
      const existingAddonsData = await client.request(GET_ENROLLMENT_ADDONS, { enrollmentId });
      const existingAddons = existingAddonsData.CourseEnrollmentAddon || [];
      backupAddonObjects = existingAddons.map(row => ({
        enrollmentId,
        addonMappingId: row.addonMappingId,
        priceAtPurchase: row.priceAtPurchase,
        currency: row.currency
      }));
      logger.debug('Fetched backup of existing enrollment addons', {
        enrollmentId,
        backupCount: backupAddonObjects.length
      });
    } catch (backupError) {
      logger.warn('Could not fetch existing addons for backup (may not exist yet)', {
        error: backupError.message,
        enrollmentId
      });
    }

    try {
      const deleteResult = await client.request(DELETE_ENROLLMENT_ADDONS, {
        enrollmentId
      });
      logger.info('Deleted existing enrollment addons', {
        enrollmentId,
        deletedCount: deleteResult.delete_CourseEnrollmentAddon?.affected_rows || 0
      });
    } catch (deleteError) {
      logger.warn('Failed to delete existing enrollment addons (may not exist yet)', {
        error: deleteError.message,
        enrollmentId
      });
      // Continue - this is fine for first-time enrollment
    }

    if (selectedAddons.length > 0) {
      const addonObjects = selectedAddons.map(addon => ({
        enrollmentId,
        addonMappingId: addon.id,
        priceAtPurchase: addon.validatedPrice,
        currency: addon.currency
      }));

      try {
        const insertResult = await client.request(INSERT_ENROLLMENT_ADDONS, {
          objects: addonObjects
        });

        logger.info('Enrollment addons saved successfully', {
          enrollmentId,
          addonCount: insertResult.insert_CourseEnrollmentAddon?.affected_rows || 0
        });
      } catch (insertError) {
        logger.error('Failed to insert enrollment addons', {
          error: insertError.message,
          stack: insertError.stack,
          enrollmentId,
          addonCount: selectedAddons.length
        });

        if (backupAddonObjects.length > 0) {
          try {
            await client.request(INSERT_ENROLLMENT_ADDONS, {
              objects: backupAddonObjects
            });
            logger.info('Restored previous addon state after insert failure', {
              enrollmentId,
              restoredCount: backupAddonObjects.length
            });
          } catch (restoreError) {
            logger.error('Failed to restore backup addons after insert failure', {
              enrollmentId,
              restoreError: restoreError.message,
              insertError: insertError.message,
              backupCount: backupAddonObjects.length
            });
          }
        } else {
          logger.warn('No backup available to restore - addons were empty before delete', { enrollmentId });
        }
      }
    }

    return {
      success: true,
      enrollmentId,
      selectedAddons,
      messageKey: 'SUCCESS'
    };

  } catch (error) {
    logger.error('Error creating enrollment with addons', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'INTERNAL_ERROR',
      enrollmentId: null,
      selectedAddons: []
    };
  }
}
