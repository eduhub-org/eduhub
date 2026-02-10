import { GraphQLClient } from 'graphql-request';

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
 * Extracts the base URL and survey ID from a Formbricks survey URL.
 * 
 * URL format: https://formbricks.example.com/s/{surveyId}
 * 
 * @param {string} surveyUrl - The Formbricks survey URL
 * @returns {Object|null} Object with baseUrl and surveyId, or null if invalid
 */
function extractFormbricksBaseUrlAndSurveyId(surveyUrl) {
  if (!surveyUrl) return null;
  
  try {
    const urlObj = new URL(surveyUrl);
    const pathParts = urlObj.pathname.split('/');
    const sIndex = pathParts.indexOf('s');
    
    if (sIndex !== -1 && pathParts[sIndex + 1]) {
      const surveyId = pathParts[sIndex + 1].split('?')[0];
      const baseUrl = urlObj.origin;
      return { baseUrl, surveyId };
    }
    return null;
  } catch (error) {
    return null;
  }
}

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
  const responsesUrl = new URL(`${formbricksApiUrl}/api/v1/management/responses`);
  responsesUrl.searchParams.append('surveyId', formbricksSurveyId);
  responsesUrl.searchParams.append('limit', '100');

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
        userId: String(userId),
        courseId: String(courseId)
      });

      const responsesResponse = await fetch(responsesUrl.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': formbricksApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!responsesResponse.ok) {
        const errorText = await responsesResponse.text();
        logger.error(`Failed to fetch responses: ${responsesResponse.status}`, { errorText });
        if (attempt === maxRetries) {
          throw new Error(`Failed to fetch Formbricks responses: ${responsesResponse.status}`);
        }
        // Wait before retrying on API error
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      const responsesData = await responsesResponse.json();
      const allResponses = responsesData.data || [];

      logger.info(`Formbricks API returned ${allResponses.length} total responses`, {
        attempt,
        surveyId: formbricksSurveyId,
        lookingFor: { userId: String(userId), courseId: String(courseId) }
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
        
        const matchesUser = responseUserId && String(responseUserId) === String(userId);
        const matchesCourse = responseCourseId && String(responseCourseId) === String(courseId);
        
        logger.debug('Checking response match', {
          responseId: response.id,
          responseUserId: responseUserId ? String(responseUserId) : 'undefined',
          expectedUserId: String(userId),
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
          return (responseUserId && String(responseUserId) === String(userId)) || 
                 (responseCourseId && String(responseCourseId) === String(courseId));
        });

        if (attempt < maxRetries) {
          logger.warn(`No matching responses found (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`, {
            userId: String(userId),
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
 * Matches Formbricks response answers against CourseAddonMappings to find selected addons.
 * Supports multi-language surveys by mapping response labels to choice IDs.
 * 
 * IMPORTANT: CourseAddonMapping.choiceId must be a Formbricks choice ID (not a label).
 * The function maps response labels (which vary by language) to choice IDs for matching.
 * 
 * @param {Object} responseData - Formbricks response data object (contains localized labels)
 * @param {Array} addonMappings - Array of CourseAddonMapping objects (choiceId must be a Formbricks choice ID)
 * @param {Object} labelToChoiceIdMap - Map of questionId -> { normalizedLabel -> choiceId } for all languages
 * @param {Object} logger - Winston logger instance
 * @returns {Array} Array of selected addon objects with pricing
 */
function matchAddonsFromResponse(responseData, addonMappings, labelToChoiceIdMap, logger) {
  const selectedAddons = [];

  // Filter out hidden fields from response data for logging
  const answerEntries = Object.entries(responseData).filter(([key]) => !key.startsWith('eduhub'));

  logger.info('Addon mappings for matching', {
    addonCount: addonMappings.length,
    mappings: addonMappings.map(m => ({
      id: m.id,
      questionId: m.questionId,
      choiceId: m.choiceId,
      description: m.description
    })),
    fullMappings: JSON.stringify(addonMappings.map(m => ({
      id: m.id,
      questionId: m.questionId,
      choiceId: m.choiceId,
      description: m.description
    })), null, 2)
  });

  logger.info('Response data entries (excluding hidden fields)', {
    entries: answerEntries.map(([key, value]) => ({
      questionId: key,
      answerValue: value,
      answerType: Array.isArray(value) ? 'array' : typeof value
    })),
    fullEntries: JSON.stringify(answerEntries.map(([key, value]) => ({
      questionId: key,
      answerValue: value,
      answerType: Array.isArray(value) ? 'array' : typeof value
    })), null, 2)
  });

  // Log full response data structure for debugging
  logger.info('Full response data structure', {
    responseData: JSON.stringify(responseData),
    responseDataKeys: Object.keys(responseData),
    allKeys: Object.keys(responseData).map(key => ({
      key,
      value: responseData[key],
      type: typeof responseData[key],
      isArray: Array.isArray(responseData[key])
    }))
  });

  for (const addonMapping of addonMappings) {
    const answerValue = responseData[addonMapping.questionId];

    logger.info('Checking addon mapping', {
      addonId: addonMapping.id,
      questionId: addonMapping.questionId,
      expectedChoiceId: addonMapping.choiceId,
      actualAnswer: answerValue,
      answerType: answerValue === undefined ? 'undefined' : (Array.isArray(answerValue) ? 'array' : typeof answerValue),
      hasLabelMap: Object.keys(labelToChoiceIdMap[addonMapping.questionId] || {}).length > 0
    });

    if (answerValue === undefined || answerValue === null) {
      logger.debug('No answer found for question', { questionId: addonMapping.questionId });
      continue;
    }

    // Check if this addon was selected in the response
    // Handle both single-choice (string) and multi-choice (array) formats
    let isSelected = false;

    // Map response labels to choice IDs using the survey structure
    // CourseAddonMapping.choiceId should always be a choice ID (not a label)
    const questionLabelMap = labelToChoiceIdMap[addonMapping.questionId] || {};
    
    // Log the mapping for this question
    if (Object.keys(questionLabelMap).length === 0) {
      logger.warn('No label-to-ID mapping found for question', {
        questionId: addonMapping.questionId,
        availableQuestionIds: Object.keys(labelToChoiceIdMap),
        allQuestionIds: Object.keys(labelToChoiceIdMap).join(', ')
      });
    } else {
      logger.info('Label-to-ID map for question', {
        questionId: addonMapping.questionId,
        labelToIdMap: JSON.stringify(questionLabelMap, null, 2)
      });
    }

    if (Array.isArray(answerValue)) {
      // Multi-select: map response labels to IDs and check if choiceId matches
      const mappedIds = answerValue.map(answer => {
        const normalizedLabel = String(answer).trim().toLowerCase();
        const mappedChoiceId = questionLabelMap[normalizedLabel];
        return { answer, normalizedLabel, mappedChoiceId };
      });
      isSelected = mappedIds.some(m => m.mappedChoiceId === addonMapping.choiceId);
      
      logger.info('Multi-select check', {
        questionId: addonMapping.questionId,
        choiceId: addonMapping.choiceId,
        answerArray: answerValue,
        mappedIds: JSON.stringify(mappedIds, null, 2),
        isSelected
      });
    } else {
      // Single-select: map response label to ID and compare with choiceId
      const normalizedLabel = String(answerValue).trim().toLowerCase();
      const mappedChoiceId = questionLabelMap[normalizedLabel];
      isSelected = mappedChoiceId === addonMapping.choiceId;
      
      logger.info('Single-select check', {
        questionId: addonMapping.questionId,
        choiceId: addonMapping.choiceId,
        answerValue: String(answerValue),
        normalizedLabel,
        mappedChoiceId,
        isSelected
      });
    }

    if (isSelected) {
      logger.info('Addon matched!', {
        addonId: addonMapping.id,
        description: addonMapping.description,
        questionId: addonMapping.questionId,
        choiceId: addonMapping.choiceId
      });
      selectedAddons.push({
        id: addonMapping.id,
        description: addonMapping.description,
        validatedPrice: addonMapping.validatedPrice,
        currency: addonMapping.currency,
        questionId: addonMapping.questionId,
        choiceId: addonMapping.choiceId
      });
    }
  }

  logger.info('Matching complete', {
    totalMappings: addonMappings.length,
    selectedCount: selectedAddons.length,
    selectedAddons: selectedAddons.map(a => ({ id: a.id, description: a.description }))
  });

  return selectedAddons;
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

    // Create Hasura GraphQL client
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    // Step 1: Create CourseEnrollment with status APPLIED and paymentStatus PENDING
    logger.info('Creating enrollment', { courseId, userId });
    
    // Set termsAcceptedAt server-side when acceptTerms is true (authoritative timestamp)
    const termsAcceptedAt = acceptTerms === true ? new Date().toISOString() : null;
    
    const enrollmentResult = await client.request(CREATE_ENROLLMENT, {
      courseId,
      userId,
      motivationLetter: motivationLetter || '[Formbricks Survey Completed]',
      status: 'APPLIED',
      termsAcceptedAt: termsAcceptedAt,
      paymentStatus: 'PENDING' // Set to PENDING for payment flows - will be updated by webhook on success/failure
    });

    const enrollmentId = enrollmentResult.insert_CourseEnrollment?.returning?.[0]?.id;

    if (!enrollmentId) {
      logger.error('Failed to create enrollment', { courseId, userId });
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

    // Extract base URL and survey ID from the survey URL
    const urlParts = extractFormbricksBaseUrlAndSurveyId(formbricksSurveyUrl);
    if (!urlParts) {
      logger.error('Invalid Formbricks survey URL', { formbricksSurveyUrl });
      return {
        success: false,
        error: 'Invalid Formbricks survey URL format',
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
        success: false,
        error: 'Formbricks API key not configured',
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
        
        // Build label-to-choice-ID mapping for all questions
        // Handle both blocks/elements structure and questions structure
        const elements = survey.blocks?.flatMap(block => block.elements || []) || survey.questions || [];
        
        elements.forEach(element => {
          if (element.choices && Array.isArray(element.choices)) {
            const questionId = element.id;
            labelToChoiceIdMap[questionId] = {};
            
            // For each choice, map all language variants of the label to the choice ID
            element.choices.forEach(choice => {
              if (choice.label) {
                // Handle i18n object: { default: "English", de: "German", ... }
                if (typeof choice.label === 'object' && choice.label !== null) {
                  Object.values(choice.label).forEach(label => {
                    if (label && typeof label === 'string') {
                      labelToChoiceIdMap[questionId][label.toLowerCase().trim()] = choice.id;
                    }
                  });
                } else if (typeof choice.label === 'string') {
                  // Single string label
                  labelToChoiceIdMap[questionId][choice.label.toLowerCase().trim()] = choice.id;
                }
              }
            });
          }
        });
        
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
          success: false,
          error: 'Failed to fetch Formbricks survey structure. Cannot match addons without choice ID mapping.',
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
        success: false,
        error: `Error fetching Formbricks survey structure: ${error.message}. Cannot match addons without choice ID mapping.`,
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
      userId,
      courseId,
      logger
    );

    if (!latestResponse) {
      logger.warn('No Formbricks response found for user/course after retries', { 
        userId: String(userId), 
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
    // First, delete any existing addons to prevent duplicates when user retries with changed selections
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

    // Now insert the new addons
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
          enrollmentId,
          addonCount: selectedAddons.length
        });
        // Don't fail the entire operation if addon insertion fails
        // Enrollment is already created, addons can be retried later
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
