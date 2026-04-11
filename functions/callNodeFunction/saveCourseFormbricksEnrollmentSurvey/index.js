import { GraphQLClient } from 'graphql-request';
import { validateAndExtractFormbricksSurvey } from '../lib/formbricks.js';

const UPDATE_COURSE_FORMBRICKS_SURVEY = `
  mutation UpdateCourseFormbricksSurvey($courseId: Int!, $surveyUrl: String) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { formbricksEnrollmentSurveyUrl: $surveyUrl }
    ) {
      id
      formbricksEnrollmentSurveyUrl
    }
  }
`;

const parseActionInput = (req) => {
  const payload = req.body?.input ?? req.body ?? {};
  return {
    itemId: payload.itemId,
    text: payload.text,
  };
};

const buildHasuraClient = () => {
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
    },
  });
};

const updateCourseSurveyUrl = async (client, courseId, surveyUrl) => {
  const result = await client.request(UPDATE_COURSE_FORMBRICKS_SURVEY, {
    courseId,
    surveyUrl,
  });
  return result?.update_Course_by_pk ?? null;
};

const REQUIRED_HIDDEN_FIELD_IDS = ['eduhubUserId', 'eduhubCourseId'];

const collectConfiguredHiddenFieldIds = (survey) => {
  if (!survey || typeof survey !== 'object') return [];

  const configuredFieldIds = new Set();
  const rawHiddenFields = survey.hiddenFields;

  const addFieldId = (value) => {
    if (typeof value !== 'string') return;
    const normalized = value.trim();
    if (normalized) configuredFieldIds.add(normalized);
  };

  if (Array.isArray(rawHiddenFields)) {
    for (const hiddenField of rawHiddenFields) {
      if (typeof hiddenField === 'string') {
        addFieldId(hiddenField);
      } else if (hiddenField && typeof hiddenField === 'object') {
        addFieldId(hiddenField.id);
        addFieldId(hiddenField.key);
        addFieldId(hiddenField.name);
      }
    }
  } else if (rawHiddenFields && typeof rawHiddenFields === 'object') {
    const hiddenFieldIds = rawHiddenFields.fieldIds;
    if (Array.isArray(hiddenFieldIds)) {
      hiddenFieldIds.forEach((fieldId) => addFieldId(fieldId));
    }

    if (Array.isArray(rawHiddenFields.fields)) {
      for (const field of rawHiddenFields.fields) {
        if (typeof field === 'string') {
          addFieldId(field);
        } else if (field && typeof field === 'object') {
          addFieldId(field.id);
          addFieldId(field.key);
          addFieldId(field.name);
        }
      }
    }
  }

  return [...configuredFieldIds];
};

export default async function saveCourseFormbricksEnrollmentSurvey(req, logger) {
  logger.info('########## Save Course Formbricks Enrollment Survey ##########');
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { itemId, text } = parseActionInput(req);
    const courseId = Number.parseInt(String(itemId), 10);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return {
        success: false,
        messageKey: 'MISSING_COURSE_ID',
        error: 'Course ID is required',
      };
    }

    if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
      logger.error('Hasura endpoint/admin secret missing');
      return {
        success: false,
        messageKey: 'HASURA_NOT_CONFIGURED',
        error: 'Hasura endpoint or admin secret is not configured',
      };
    }

    const normalizedInput = typeof text === 'string' ? text.trim() : '';
    const hasuraClient = buildHasuraClient();

    if (!normalizedInput) {
      const updatedCourse = await updateCourseSurveyUrl(hasuraClient, courseId, null);
      if (!updatedCourse) {
        return {
          success: false,
          messageKey: 'COURSE_NOT_FOUND',
          error: 'Course not found',
        };
      }

      return {
        success: true,
        messageKey: 'FORMBRICKS_SURVEY_URL_SAVED',
        courseId: updatedCourse.id,
        formbricksEnrollmentSurveyUrl: updatedCourse.formbricksEnrollmentSurveyUrl,
      };
    }

    const surveyParts = validateAndExtractFormbricksSurvey(normalizedInput, logger);
    if (!surveyParts) {
      const hasTrustedOrigins = !!(
        process.env.FORMBRICKS_API_URL ||
        process.env.FORMBRICKS_BASE_URL ||
        process.env.FORMBRICKS_TRUSTED_ORIGINS
      );

      return {
        success: false,
        messageKey: hasTrustedOrigins ? 'INVALID_SURVEY_URL' : 'FORMBRICKS_NOT_CONFIGURED',
        error: hasTrustedOrigins
          ? 'Please provide a valid Formbricks Link Survey URL from a trusted Formbricks origin.'
          : 'Formbricks is not configured. Missing FORMBRICKS_API_URL, FORMBRICKS_BASE_URL, or FORMBRICKS_TRUSTED_ORIGINS.',
      };
    }

    const formbricksApiKey = process.env.FORMBRICKS_API_KEY;
    if (!formbricksApiKey) {
      logger.error('Formbricks API key missing');
      return {
        success: false,
        messageKey: 'FORMBRICKS_NOT_CONFIGURED',
        error: 'Formbricks API key is not configured',
      };
    }

    const { baseUrl, surveyId } = surveyParts;
    const formbricksSurveyApiUrl = `${baseUrl}/api/v1/management/surveys/${surveyId}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let surveyResponse;
    try {
      surveyResponse = await fetch(formbricksSurveyApiUrl, {
        method: 'GET',
        headers: {
          'x-api-key': formbricksApiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      const fetchError = error instanceof Error ? error : new Error(String(error));

      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          messageKey: 'FORMBRICKS_TIMEOUT',
          error: 'Formbricks validation request timed out after 10 seconds.',
        };
      }

      logger.error('Failed to validate Formbricks survey access', {
        error: fetchError.message,
        surveyId,
        formbricksSurveyApiUrl,
      });
      return {
        success: false,
        messageKey: 'FORMBRICKS_FETCH_ERROR',
        error: `Failed to validate Formbricks survey access: ${fetchError.message}`,
      };
    }

    clearTimeout(timeoutId);

    if (!surveyResponse.ok) {
      const errorText = await surveyResponse.text();
      logger.error('Formbricks survey access validation failed', {
        status: surveyResponse.status,
        surveyId,
        errorText,
      });

      if (surveyResponse.status === 401 || surveyResponse.status === 403) {
        return {
          success: false,
          messageKey: 'FORMBRICKS_AUTH_ERROR',
          error: 'The configured Formbricks API token cannot access this survey.',
        };
      }

      if (surveyResponse.status === 404) {
        return {
          success: false,
          messageKey: 'FORMBRICKS_SURVEY_NOT_FOUND',
          error: 'The Formbricks survey was not found or is not accessible with the configured API token.',
        };
      }

      return {
        success: false,
        messageKey: 'FORMBRICKS_FETCH_ERROR',
        error: `Failed to validate Formbricks survey access: ${surveyResponse.status} - ${errorText}`,
      };
    }

    const surveyPayload = await surveyResponse.json();
    const survey = surveyPayload?.data ?? surveyPayload;
    const configuredHiddenFieldIds = collectConfiguredHiddenFieldIds(survey);
    const missingHiddenFields = REQUIRED_HIDDEN_FIELD_IDS.filter(
      (requiredField) => !configuredHiddenFieldIds.includes(requiredField)
    );

    if (missingHiddenFields.length > 0) {
      logger.warn('Formbricks survey is missing required hidden fields', {
        surveyId,
        configuredHiddenFieldIds,
        missingHiddenFields,
      });
      return {
        success: false,
        messageKey: 'FORMBRICKS_REQUIRED_HIDDEN_FIELDS_MISSING',
        error: `The Formbricks survey is missing required hidden fields: ${missingHiddenFields.join(', ')}.`,
      };
    }

    const canonicalSurveyUrl = `${baseUrl}/s/${surveyId}`;
    const updatedCourse = await updateCourseSurveyUrl(hasuraClient, courseId, canonicalSurveyUrl);
    if (!updatedCourse) {
      return {
        success: false,
        messageKey: 'COURSE_NOT_FOUND',
        error: 'Course not found',
      };
    }

    return {
      success: true,
      messageKey: 'FORMBRICKS_SURVEY_URL_SAVED',
      courseId: updatedCourse.id,
      surveyId,
      formbricksEnrollmentSurveyUrl: updatedCourse.formbricksEnrollmentSurveyUrl,
    };
  } catch (error) {
    const caughtError = error instanceof Error ? error : new Error(String(error));
    logger.error('Error saving Formbricks enrollment survey URL', {
      error: caughtError.message,
      stack: caughtError.stack,
    });

    return {
      success: false,
      messageKey: 'FORMBRICKS_SURVEY_SAVE_ERROR',
      error: caughtError.message || 'Internal server error',
    };
  }
}
