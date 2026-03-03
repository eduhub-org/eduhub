import { validateAndExtractFormbricksSurvey } from '../lib/formbricks.js';

/**
 * Fetches Formbricks survey responses for a specific enrollment.
 * Uses hidden fields to correlate responses with EduHub data.
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
    
    // Extract base URL and survey ID from the survey URL (with SSRF protection)
    const urlParts = validateAndExtractFormbricksSurvey(formbricksSurveyUrl, logger);
    if (!urlParts) {
      logger.error('Invalid Formbricks survey URL', { formbricksSurveyUrl });
      return {
        success: false,
        error: 'Invalid Formbricks survey URL format',
        messageKey: 'INVALID_SURVEY_URL'
      };
    }
    
    const { baseUrl: formbricksApiUrl, surveyId: formbricksSurveyId } = urlParts;
    const formbricksApiKey = process.env.FORMBRICKS_API_KEY;
    
    logger.debug('Formbricks configuration check', {
      extractedBaseUrl: formbricksApiUrl,
      extractedSurveyId: formbricksSurveyId,
      hasKey: !!formbricksApiKey,
      keyLength: formbricksApiKey?.length || 0
    });
    
    if (!formbricksApiKey) {
      logger.error('Formbricks API key missing');
      return {
        success: false,
        error: 'Formbricks API key not configured',
        messageKey: 'FORMBRICKS_NOT_CONFIGURED'
      };
    }
    
    // Fetch the survey structure first (to get question labels)
    const surveyUrl = `${formbricksApiUrl}/api/v1/management/surveys/${formbricksSurveyId}`;
    logger.debug('Fetching survey from Formbricks', { 
      surveyUrl, 
      surveyId: formbricksSurveyId,
      apiKeyPresent: !!formbricksApiKey,
      apiKeyLength: formbricksApiKey?.length || 0
    });
    
    const requestHeaders = {
      'x-api-key': formbricksApiKey,
      'Content-Type': 'application/json'
    };
    
    logger.debug('Request headers prepared', { 
      hasApiKeyHeader: !!requestHeaders['x-api-key'],
      headerKeys: Object.keys(requestHeaders)
    });
    
    const surveyResponse = await fetch(surveyUrl, {
      method: 'GET',
      headers: requestHeaders
    });
    
    if (!surveyResponse.ok) {
      const errorText = await surveyResponse.text();
      logger.error(`Failed to fetch survey: ${surveyResponse.status}`, { 
        errorText,
        surveyUrl,
        status: surveyResponse.status,
        statusText: surveyResponse.statusText
      });
      
      // Provide more helpful error messages
      if (surveyResponse.status === 401) {
        let errorData = null;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          // If errorText is not JSON (e.g., plain text 401 response), fall back to raw text
          // This prevents a SyntaxError from masking the original authentication failure
          logger.debug('Error response is not JSON, using raw text', { 
            errorText, 
            parseError: parseError.message 
          });
        }
        
        // Check for API key details in parsed JSON, or use raw text as fallback
        const apiKeyError = errorData?.details?.['x-Api-Key'] || errorText;
        throw new Error(`Formbricks API authentication failed: ${apiKeyError}. Please verify your FORMBRICKS_API_KEY is a Management API key with 'read' permissions, not a client-side API key.`);
      }
      
      throw new Error(`Failed to fetch survey: ${surveyResponse.status} - ${errorText}`);
    }
    
    const surveyData = await surveyResponse.json();
    
    // Fetch responses filtered by surveyId
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
      throw new Error(`Failed to fetch responses: ${responsesResponse.status} - ${errorText}`);
    }
    
    const responsesData = await responsesResponse.json();
    
    logger.debug('Fetched responses from Formbricks', {
      totalResponses: responsesData.data?.length || 0,
      lookingFor: { userId, courseId, enrollmentId }
    });
    
    // Filter responses by eduhub* hidden fields
    // Hidden fields are stored directly in response.data (not in response.data.hiddenFields)
    // Note: We use 'eduhub*' prefix to avoid conflicts with Formbricks internal variables
    const userResponses = (responsesData.data || []).filter(response => {
      // Hidden fields are stored directly in response.data alongside question answers
      const responseData = response.data || {};
      
      const responseUserId = responseData.eduhubUserId;
      const responseCourseId = responseData.eduhubCourseId;
      const responseEnrollmentId = responseData.eduhubEnrollmentId;
      
      logger.debug('Checking response', {
        responseId: response.id,
        responseData: responseData,
        foundUserId: responseUserId,
        foundCourseId: responseCourseId,
        foundEnrollmentId: responseEnrollmentId,
        lookingFor: { userId, courseId, enrollmentId }
      });
      
      // Must match userId and courseId (both required)
      // enrollmentId is optional: if provided in request AND in response, they must match
      // But if enrollmentId is not in response (common during registration), still allow match
      const userIdMatches = responseUserId === String(userId);
      const courseIdMatches = responseCourseId === String(courseId);
      
      // Only check enrollmentId if BOTH are present (request has it AND response has it)
      // If response doesn't have enrollmentId, that's fine (enrollment created after survey)
      const enrollmentIdMatches = enrollmentId && responseEnrollmentId 
        ? responseEnrollmentId === String(enrollmentId)
        : true; // If either is missing, don't filter by enrollmentId
      
      const matches = userIdMatches && courseIdMatches && enrollmentIdMatches;
      
      if (!matches) {
        logger.debug('Response does not match filters', {
          responseId: response.id,
          userIdMatches,
          courseIdMatches,
          enrollmentIdMatches
        });
      }
      
      return matches;
    });
    
    logger.debug('Filtered responses', {
      matchedCount: userResponses.length,
      totalChecked: responsesData.data?.length || 0
    });
    
    // Transform responses to include question labels
    const survey = surveyData.data || surveyData;
    
    logger.debug('Survey structure', { 
      surveyKeys: Object.keys(survey),
      hasBlocks: !!survey.blocks,
      hasQuestions: !!survey.questions,
      blockCount: survey.blocks?.length || 0,
      questionCount: survey.questions?.length || 0
    });
    
    // Formbricks can return questions directly or nested in blocks/elements
    const questions = extractSurveyQuestions(survey);
    
    // Create a map of possible response keys to question metadata
    const questionDescriptors = questions
      .filter(q => q?.id)
      .map((q, index) => ({
        questionId: q.id,
        responseKeys: extractQuestionResponseKeys(q),
        headline: extractQuestionTitle(q) || q.id,
        type: q.type || 'unknown',
        order: index
      }));

    const questionMap = {};
    questionDescriptors.forEach((descriptor) => {
      descriptor.responseKeys.forEach((key) => {
        questionMap[key] = {
          headline: descriptor.headline,
          type: descriptor.type,
          order: descriptor.order,
          questionId: descriptor.questionId
        };
      });
    });

    logger.debug('Formbricks question key mapping', {
      questionCount: questionDescriptors.length,
      sampleQuestions: questionDescriptors.slice(0, 5).map((q) => ({
        questionId: q.questionId,
        responseKeys: q.responseKeys,
        headline: q.headline
      }))
    });

    const surveyQuestionKeys = new Set(Object.keys(questionMap));
    const sampleResponseData = userResponses[0]?.data || {};
    const sampleResponseKeys = Object.keys(sampleResponseData).filter(key => !key.startsWith('eduhub'));
    const matchingSampleKeys = sampleResponseKeys.filter(key => surveyQuestionKeys.has(key));

    logger.debug('Formbricks key overlap diagnostics', {
      sampleResponseKeyCount: sampleResponseKeys.length,
      surveyMappedKeyCount: surveyQuestionKeys.size,
      matchingKeyCount: matchingSampleKeys.length,
      sampleResponseKeys: sampleResponseKeys.slice(0, 10),
      matchingSampleKeys: matchingSampleKeys.slice(0, 10)
    });
    
    const formattedResponses = userResponses.map(response => {
      const answers = [];
      
      // Process response data
      const responseData = response.data || {};
      const usedResponseKeys = new Set();

      const toFormattedAnswer = (responseKey, answerValue) => {
        const question = questionMap[responseKey];
        const headline = question?.headline || responseKey;

        return {
          questionId: question?.questionId || responseKey,
          headline,
          answer: formatAnswer(answerValue),
          rawAnswer: answerValue
        };
      };

      // First, add answers in survey/questionnaire order.
      questionDescriptors.forEach((descriptor) => {
        const matchingResponseKey = descriptor.responseKeys.find((key) => {
          return !key.startsWith('eduhub') && Object.hasOwn(responseData, key);
        });

        if (!matchingResponseKey) return;

        usedResponseKeys.add(matchingResponseKey);
        answers.push(toFormattedAnswer(matchingResponseKey, responseData[matchingResponseKey]));
      });

      // Then add any additional answer keys that were not part of the mapped survey keys.
      for (const [responseKey, answerValue] of Object.entries(responseData)) {
        if (responseKey.startsWith('eduhub')) continue;
        if (usedResponseKeys.has(responseKey)) continue;

        answers.push(toFormattedAnswer(responseKey, answerValue));
      }

      return {
        id: response.id,
        createdAt: response.createdAt,
        finished: response.finished || false,
        answers
      };
    });
    
    // Sort by creation date (newest first)
    formattedResponses.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    logger.info('Successfully fetched Formbricks responses', { 
      count: formattedResponses.length,
      surveyId: formbricksSurveyId,
      baseUrl: formbricksApiUrl
    });
    
    return {
      success: true,
      responses: formattedResponses,
      survey: {
        id: survey.id || formbricksSurveyId,
        name: survey.name || 'Unknown Survey'
      }
    };
    
  } catch (error) {
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

/**
 * Formats answer values for display based on Formbricks question types
 * 
 * Supported question types and their answer formats:
 * - openText: string
 * - multipleChoiceSingle: string (selected option)
 * - multipleChoiceMulti: array of strings
 * - nps: number (0-10)
 * - rating: number
 * - cta: string (clicked/dismissed)
 * - consent: boolean
 * - pictureSelection: string or array
 * - cal: string (booking link/status)
 * - fileUpload: string (file URL) or array of URLs
 * - matrix: object with row/column selections
 * - address: object with address fields
 * - contactInfo: object with contact fields
 * - date: ISO date string
 */
function formatAnswer(value) {
  // Handle null/undefined
  if (value === null || value === undefined) return '-';
  
  // Handle boolean (consent questions)
  if (typeof value === 'boolean') {
    return value ? '✓ Yes' : '✗ No';
  }
  
  // Handle arrays (multi-select, file uploads, picture selection)
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    // Check if array contains objects (e.g., file uploads with metadata)
    if (typeof value[0] === 'object' && value[0] !== null) {
      return value.map(item => {
        if (item.url) return item.url;
        if (item.label) return item.label;
        if (item.value) return item.value;
        return JSON.stringify(item);
      }).join('\n');
    }
    return formatMultipleChoiceArray(value);
  }
  
  // Handle objects (matrix, address, contact info, etc.)
  if (typeof value === 'object') {
    // File upload with URL
    if (value.url) return value.url;
    
    // Option with label (single/multi choice)
    if (value.label) return value.label;
    if (value.value) return value.value;
    
    // Address object
    if (value.street || value.city || value.zip || value.country) {
      const parts = [];
      if (value.street) parts.push(value.street);
      if (value.zip || value.city) parts.push([value.zip, value.city].filter(Boolean).join(' '));
      if (value.state) parts.push(value.state);
      if (value.country) parts.push(value.country);
      return parts.join('\n');
    }
    
    // Contact info object
    if (value.email || value.phone || value.firstName || value.lastName) {
      const parts = [];
      if (value.firstName || value.lastName) {
        parts.push([value.firstName, value.lastName].filter(Boolean).join(' '));
      }
      if (value.email) parts.push(value.email);
      if (value.phone) parts.push(value.phone);
      return parts.join('\n');
    }
    
    // Matrix or other structured objects - format as key: value pairs
    const entries = Object.entries(value);
    if (entries.length > 0) {
      return entries
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');
    }
    
    // Fallback for unknown objects
    return JSON.stringify(value, null, 2);
  }
  
  // Handle primitives (strings, numbers for NPS/rating, dates)
  return String(value);
}

/**
 * Formats multi-select arrays and handles Formbricks "Other" text inputs.
 * Formbricks can send an empty entry followed by the custom "Other" text.
 */
function formatMultipleChoiceArray(values) {
  const normalized = values.map((entry) => String(entry ?? '').trim());
  const formatted = [];

  let index = 0;
  while (index < normalized.length) {
    const current = normalized[index];

    if (current) {
      formatted.push(current);
      index += 1;
      continue;
    }

    // Empty value followed by non-empty text is treated as "Other" free text.
    let nextIndex = index + 1;
    while (nextIndex < normalized.length && !normalized[nextIndex]) {
      nextIndex += 1;
    }

    if (nextIndex < normalized.length) {
      formatted.push(`Sonstiges: ${normalized[nextIndex]}`);
      index = nextIndex + 1;
      continue;
    }

    index += 1;
  }

  if (formatted.length === 0) {
    return '-';
  }

  return formatted.join(', ');
}

/**
 * Strips HTML tags from a string
 */
function stripHtml(html) {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);
  
  // Remove HTML tags
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extract questions from either survey.questions or survey.blocks[].elements[]
 */
function extractSurveyQuestions(survey) {
  const collected = [];
  const seenIds = new Set();

  const pushQuestion = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    if (!candidate.id) return;
    if (!looksLikeQuestion(candidate)) return;
    if (seenIds.has(candidate.id)) return;

    seenIds.add(candidate.id);
    collected.push(candidate);
  };

  const collectFromArray = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(pushQuestion);
  };

  // Known shapes (current and legacy Formbricks variants)
  collectFromArray(survey?.questions);

  if (Array.isArray(survey?.blocks)) {
    for (const block of survey.blocks) {
      collectFromArray(block?.elements);
      collectFromArray(block?.questions);
      collectFromArray(block?.items);
      collectFromArray(block?.cards);
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  // Fallback: recursively traverse blocks and pick question-like objects.
  const walk = (node) => {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    pushQuestion(node);
    Object.values(node).forEach(walk);
  };

  walk(survey?.blocks);
  return collected;
}

/**
 * Extract a displayable question title from known Formbricks title fields.
 */
function extractQuestionTitle(question) {
  const candidates = [
    question?.headline,
    question?.question,
    question?.title,
    question?.label
  ];

  for (const candidate of candidates) {
    const title = extractLocalizedText(candidate);
    if (title) return title;
  }

  return '';
}

/**
 * Extract readable text from plain string or localized object.
 */
function extractLocalizedText(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return stripHtml(value);
  }

  if (typeof value !== 'object') {
    return stripHtml(String(value));
  }

  const preferredKeys = ['default', 'de', 'en'];
  for (const key of preferredKeys) {
    const candidate = value[key];
    if (candidate) {
      return stripHtml(typeof candidate === 'string' ? candidate : String(candidate));
    }
  }

  for (const candidate of Object.values(value)) {
    if (candidate) {
      return stripHtml(typeof candidate === 'string' ? candidate : String(candidate));
    }
  }

  return '';
}

/**
 * Build all possible response keys for a Formbricks question.
 */
function extractQuestionResponseKeys(question) {
  const keys = [
    question?.id,
    question?.name,
    question?.variableId,
    question?.variableName,
    question?.slug,
    question?.key
  ].filter(Boolean);

  return [...new Set(keys.map((key) => String(key)))];
}

/**
 * Heuristic check whether an object is likely a Formbricks question node.
 */
function looksLikeQuestion(candidate) {
  const hasPrompt =
    candidate.headline != null ||
    candidate.question != null ||
    candidate.title != null ||
    candidate.label != null;

  const hasAnswerShape =
    candidate.type != null ||
    candidate.choices != null ||
    candidate.required != null;

  return hasPrompt || hasAnswerShape;
}

