import { validateAndExtractFormbricksSurvey, fetchAllFormbricksResponses } from './formbricks.js';

/**
 * Loading, matching and formatting of Formbricks survey responses, shared by
 * getFormbricksResponses (on demand, applications tab) and
 * syncFormbricksResponses (nightly cron).
 */

/** Identifies the questionnaire tool in CourseEnrollment.questionnaireResponse. */
export const QUESTIONNAIRE_PROVIDER_FORMBRICKS = 'formbricks';
/** Version of the stored JSON layout, raise it when the layout changes. */
export const QUESTIONNAIRE_FORMAT_VERSION = 1;

/** Error with a messageKey the frontend can translate. */
export class FormbricksResponsesError extends Error {
  constructor(message, messageKey) {
    super(message);
    this.messageKey = messageKey;
  }
}

/**
 * Fetches the survey definition (for question labels and types).
 * Throws on HTTP errors.
 */
async function fetchFormbricksSurvey(baseUrl, surveyId, apiKey, logger) {
  const surveyUrl = `${baseUrl}/api/v1/management/surveys/${surveyId}`;
  logger.debug('Fetching survey from Formbricks', { surveyUrl, surveyId });

  const surveyResponse = await fetch(surveyUrl, {
    method: 'GET',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  });

  if (!surveyResponse.ok) {
    const errorText = await surveyResponse.text();
    logger.error(`Failed to fetch survey: ${surveyResponse.status}`, {
      errorText,
      surveyUrl,
      status: surveyResponse.status,
      statusText: surveyResponse.statusText,
    });

    if (surveyResponse.status === 401) {
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        // Plain text 401 response, fall back to the raw text
        logger.debug('Error response is not JSON, using raw text', { errorText, parseError: parseError.message });
      }
      const apiKeyError = errorData?.details?.['x-Api-Key'] || errorText;
      throw new Error(
        `Formbricks API authentication failed: ${apiKeyError}. Please verify your FORMBRICKS_API_KEY is a Management API key with 'read' permissions, not a client-side API key.`
      );
    }

    throw new Error(`Failed to fetch survey: ${surveyResponse.status} - ${errorText}`);
  }

  const surveyData = await surveyResponse.json();
  return surveyData.data || surveyData;
}

/**
 * Validates the survey URL, then loads the survey definition and all its responses.
 *
 * @returns {Promise<{ survey: {id, name}, surveyUrl: string, questionDescriptors: Array, responses: Array }>}
 *   `responses` are the raw Formbricks responses.
 * @throws {FormbricksResponsesError} for an invalid URL or missing API key, Error for API failures
 */
export async function loadFormbricksSurveyResponses(surveyUrl, logger) {
  // Extract base URL and survey ID from the survey URL (with SSRF protection)
  const urlParts = validateAndExtractFormbricksSurvey(surveyUrl, logger);
  if (!urlParts) {
    throw new FormbricksResponsesError('Invalid Formbricks survey URL format', 'INVALID_SURVEY_URL');
  }
  const { baseUrl, surveyId } = urlParts;

  const apiKey = process.env.FORMBRICKS_API_KEY;
  if (!apiKey) {
    throw new FormbricksResponsesError('Formbricks API key not configured', 'FORMBRICKS_NOT_CONFIGURED');
  }

  const survey = await fetchFormbricksSurvey(baseUrl, surveyId, apiKey, logger);
  const responses = await fetchAllFormbricksResponses(baseUrl, surveyId, apiKey, logger);

  return {
    survey: { id: survey.id || surveyId, name: survey.name || 'Unknown Survey' },
    surveyUrl,
    questionDescriptors: buildQuestionDescriptors(survey),
    responses,
  };
}

/** Question id, the response keys it may be stored under, headline and type, in survey order. */
export function buildQuestionDescriptors(survey) {
  // Formbricks can return questions directly or nested in blocks/elements
  return extractSurveyQuestions(survey)
    .filter((q) => q?.id)
    .map((q, index) => ({
      questionId: q.id,
      responseKeys: extractQuestionResponseKeys(q),
      headline: extractQuestionTitle(q) || q.id,
      type: q.type || 'unknown',
      order: index,
    }));
}

/**
 * Whether a raw response belongs to the enrollment, judged by the eduhub* hidden fields
 * (stored directly in response.data). userId and courseId must match. enrollmentId only
 * counts when both sides have it: during registration the survey is usually filled in
 * before the enrollment exists.
 */
export function responseMatchesEnrollment(response, { userId, courseId, enrollmentId }) {
  const responseData = response?.data || {};
  const userIdMatches = responseData.eduhubUserId === String(userId);
  const courseIdMatches = responseData.eduhubCourseId === String(courseId);
  const enrollmentIdMatches =
    enrollmentId && responseData.eduhubEnrollmentId
      ? responseData.eduhubEnrollmentId === String(enrollmentId)
      : true;
  return userIdMatches && courseIdMatches && enrollmentIdMatches;
}

/**
 * Maps a raw response to { id, createdAt, finished, answers }, answers in survey order
 * with question headline and type, followed by answer keys the survey does not know.
 */
export function formatFormbricksResponse(response, questionDescriptors) {
  const questionMap = {};
  questionDescriptors.forEach((descriptor) => {
    descriptor.responseKeys.forEach((key) => {
      questionMap[key] = descriptor;
    });
  });

  const answers = [];
  const responseData = response.data || {};
  const usedResponseKeys = new Set();

  const toFormattedAnswer = (responseKey, answerValue) => {
    const question = questionMap[responseKey];
    return {
      questionId: question?.questionId || responseKey,
      questionType: question?.type || 'unknown',
      headline: question?.headline || responseKey,
      answer: formatAnswer(answerValue),
      rawAnswer: answerValue,
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
    answers,
  };
}

/** The enrollment's formatted responses, newest first. */
export function formattedResponsesForEnrollment(loaded, enrollment) {
  return loaded.responses
    .filter((response) => responseMatchesEnrollment(response, enrollment))
    .map((response) => formatFormbricksResponse(response, loaded.questionDescriptors))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * The JSON stored in CourseEnrollment.questionnaireResponse. "provider" comes first so
 * readers can tell Formbricks data from that of other questionnaire tools.
 */
export function toStoredQuestionnaireResponse({ survey, surveyUrl }, formattedResponse, now = new Date()) {
  return {
    provider: QUESTIONNAIRE_PROVIDER_FORMBRICKS,
    formatVersion: QUESTIONNAIRE_FORMAT_VERSION,
    fetchedAt: now.toISOString(),
    survey: { id: survey.id, name: survey.name, url: surveyUrl },
    response: formattedResponse,
  };
}

const UPDATE_QUESTIONNAIRE_RESPONSE = `
  mutation UpdateEnrollmentQuestionnaireResponse($id: Int!, $questionnaireResponse: jsonb!) {
    update_CourseEnrollment_by_pk(pk_columns: { id: $id }, _set: { questionnaireResponse: $questionnaireResponse }) {
      id
    }
  }
`;

/** Stores the JSON on the enrollment; the client must use the admin secret. */
export async function storeQuestionnaireResponse(client, enrollmentId, questionnaireResponse) {
  await client.request(UPDATE_QUESTIONNAIRE_RESPONSE, { id: Number(enrollmentId), questionnaireResponse });
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
export function formatAnswer(value) {
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
export function extractSurveyQuestions(survey) {
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
export function extractQuestionTitle(question) {
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
export function extractQuestionResponseKeys(question) {
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

