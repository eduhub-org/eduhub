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
 * Fetches selected addons from the latest Formbricks response for a user/course.
 * Matches Formbricks answers against CourseAddonMappings to return selected addons with pricing.
 * 
 * @param {Object} req - Request object containing body with courseId, userId, formbricksSurveyUrl
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Selected addons with pricing details or error
 */
export default async function getFormbricksAddonSelections(req, logger) {
  logger.info("########## Get Formbricks Addon Selections ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { courseId, userId, formbricksSurveyUrl } = req.body.input || req.body;
    
    // Validate required inputs
    if (!courseId || !userId) {
      return {
        success: false,
        selectedAddons: [],
        error: 'Missing required parameters: courseId and userId are required',
        messageKey: 'MISSING_PARAMETERS'
      };
    }
    
    if (!formbricksSurveyUrl) {
      // No survey configured - return empty addons
      return {
        success: true,
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
        selectedAddons: [],
        error: 'Invalid Formbricks survey URL format',
        messageKey: 'INVALID_SURVEY_URL'
      };
    }
    
    const { baseUrl: formbricksApiUrl, surveyId: formbricksSurveyId } = urlParts;
    const formbricksApiKey = process.env.FORMBRICKS_API_KEY;
    
    if (!formbricksApiKey) {
      logger.error('Formbricks API key missing');
      return {
        success: false,
        selectedAddons: [],
        error: 'Formbricks API key not configured',
        messageKey: 'FORMBRICKS_NOT_CONFIGURED'
      };
    }
    
    // Fetch CourseAddonMappings from Hasura
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });
    
    const courseData = await client.request(GET_COURSE_ADDONS, { courseId });
    const addonMappings = courseData.Course_by_pk?.CourseAddonMappings || [];
    
    if (addonMappings.length === 0) {
      // No addons configured for this course
      return {
        success: true,
        selectedAddons: [],
        messageKey: 'NO_ADDONS_CONFIGURED'
      };
    }
    
    // Fetch the latest Formbricks response for this user/course
    const responsesUrl = new URL(`${formbricksApiUrl}/api/v1/management/responses`);
    responsesUrl.searchParams.append('surveyId', formbricksSurveyId);
    responsesUrl.searchParams.append('limit', '100');
    
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
      return {
        success: false,
        selectedAddons: [],
        error: `Failed to fetch Formbricks responses: ${responsesResponse.status}`,
        messageKey: 'FORMBRICKS_FETCH_ERROR'
      };
    }
    
    const responsesData = await responsesResponse.json();
    
    logger.info('Formbricks API response', {
      totalResponses: responsesData.data?.length || 0,
      lookingFor: { userId, courseId }
    });
    
    // Log all responses for debugging
    if (responsesData.data && responsesData.data.length > 0) {
      responsesData.data.forEach((response, index) => {
        const rd = response.data || {};
        logger.debug(`Response ${index}`, {
          id: response.id,
          finished: response.finished,
          eduhubUserId: rd.eduhubUserId,
          eduhubCourseId: rd.eduhubCourseId,
          dataKeys: Object.keys(rd)
        });
      });
    }
    
    // Filter responses by userId and courseId (from hidden fields)
    // Note: Convert to String for comparison as Formbricks stores these as strings
    const userResponses = (responsesData.data || []).filter(response => {
      const responseData = response.data || {};
      const responseUserId = responseData.eduhubUserId;
      const responseCourseId = responseData.eduhubCourseId;
      
      // Use String() for consistent comparison - Formbricks stores values as strings
      const matchesUser = String(responseUserId) === String(userId);
      const matchesCourse = String(responseCourseId) === String(courseId);
      const isFinished = response.finished === true;
      
      logger.debug('Filtering response', {
        responseId: response.id,
        matchesUser,
        matchesCourse,
        isFinished,
        responseUserId,
        expectedUserId: String(userId),
        responseCourseId,
        expectedCourseId: String(courseId)
      });
      
      return matchesUser && matchesCourse && isFinished;
    });
    
    // Also check for unfinished responses that match (to detect timing issues)
    const unfinshedMatchingResponses = (responsesData.data || []).filter(response => {
      const responseData = response.data || {};
      const matchesUser = String(responseData.eduhubUserId) === String(userId);
      const matchesCourse = String(responseData.eduhubCourseId) === String(courseId);
      return matchesUser && matchesCourse && response.finished !== true;
    });
    
    logger.info('Filtered user responses', {
      finishedCount: userResponses.length,
      unfinishedCount: unfinshedMatchingResponses.length,
      userId: String(userId),
      courseId: String(courseId)
    });
    
    if (userResponses.length === 0) {
      // Check if there are unfinished responses - indicates timing issue
      if (unfinshedMatchingResponses.length > 0) {
        logger.warn('Found unfinished responses for user/course - timing issue likely', {
          userId: String(userId),
          courseId: String(courseId),
          unfinishedCount: unfinshedMatchingResponses.length,
          unfinishedIds: unfinshedMatchingResponses.map(r => r.id)
        });
        // Use the most recent unfinished response if no finished ones exist
        // This handles the timing issue where survey just completed
        const mostRecentUnfinished = unfinshedMatchingResponses.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        userResponses.push(mostRecentUnfinished);
        logger.info('Using most recent unfinished response as fallback', {
          responseId: mostRecentUnfinished.id
        });
      } else {
        // No completed responses found
        logger.warn('No responses found for user/course', {
          userId: String(userId),
          courseId: String(courseId),
          totalResponsesFromApi: responsesData.data?.length || 0
        });
        return {
          success: true,
          selectedAddons: [],
          messageKey: 'NO_RESPONSES_FOUND'
        };
      }
    }
    
    // Get the most recent response
    const latestResponse = userResponses.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    
    // Extract response data - Formbricks stores answers directly in response.data as key-value pairs
    // Keys are questionId strings, values are the answer (choiceId for single choice, or array for multi-select)
    const responseData = latestResponse.data || {};
    
    // Count actual answer entries (excluding hidden fields)
    const answerEntries = Object.entries(responseData).filter(([key]) => !key.startsWith('eduhub'));
    
    logger.debug('Found latest response', {
      responseId: latestResponse.id,
      createdAt: latestResponse.createdAt,
      answerCount: answerEntries.length,
      responseDataKeys: Object.keys(responseData)
    });
    
    // Log addon mappings for debugging
    logger.info('Addon mappings for course', {
      courseId,
      addonCount: addonMappings.length,
      mappings: addonMappings.map(m => ({
        id: m.id,
        questionId: m.questionId,
        choiceId: m.choiceId,
        description: m.description
      }))
    });
    
    // Log all answer keys and values from the response for debugging
    logger.info('Response data entries', {
      entries: answerEntries.map(([key, value]) => ({
        questionId: key,
        answerValue: value,
        answerType: Array.isArray(value) ? 'array' : typeof value
      }))
    });
    
    // Log full response data structure for debugging
    logger.info('Full response data structure', {
      responseId: latestResponse.id,
      responseData: JSON.stringify(responseData),
      responseDataKeys: Object.keys(responseData),
      allKeys: Object.keys(responseData).map(key => ({
        key,
        value: responseData[key],
        type: typeof responseData[key],
        isArray: Array.isArray(responseData[key])
      }))
    });
    
    // Match answers against CourseAddonMappings
    const selectedAddons = [];
    
    for (const addonMapping of addonMappings) {
      // Get the answer value for this questionId from response.data
      const answerValue = responseData[addonMapping.questionId];
      
      logger.debug('Checking addon mapping', {
        addonId: addonMapping.id,
        questionId: addonMapping.questionId,
        expectedChoiceId: addonMapping.choiceId,
        actualAnswer: answerValue,
        answerType: answerValue === undefined ? 'undefined' : (Array.isArray(answerValue) ? 'array' : typeof answerValue)
      });
      
      // Skip if no answer for this question
      if (answerValue === undefined || answerValue === null) {
        logger.debug('No answer found for question', { questionId: addonMapping.questionId });
        continue;
      }
      
      // Check if this addon was selected in the response
      // Handle both single-choice (string) and multi-choice (array) formats
      let isSelected = false;
      
      if (Array.isArray(answerValue)) {
        // Multi-select: check if choiceId is in the array
        isSelected = answerValue.includes(addonMapping.choiceId);
        logger.debug('Multi-select check', {
          choiceId: addonMapping.choiceId,
          answerArray: answerValue,
          isSelected
        });
      } else {
        // Single-select: check if answer matches choiceId
        isSelected = String(answerValue) === String(addonMapping.choiceId);
        logger.debug('Single-select check', {
          choiceId: addonMapping.choiceId,
          answerValue: String(answerValue),
          isSelected
        });
      }
      
      if (isSelected) {
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
    
    logger.info('Extracted selected addons', {
      courseId,
      userId,
      totalAddons: addonMappings.length,
      selectedCount: selectedAddons.length,
      selectedAddons: selectedAddons.map(a => ({ id: a.id, description: a.description }))
    });
    
    return {
      success: true,
      selectedAddons,
      messageKey: 'SUCCESS'
    };
    
  } catch (error) {
    logger.error('Error fetching Formbricks addon selections', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      selectedAddons: [],
      error: error.message || 'Internal server error',
      messageKey: 'INTERNAL_ERROR'
    };
  }
}
