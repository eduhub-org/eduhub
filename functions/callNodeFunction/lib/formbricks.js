/**
 * Builds a map of questionId -> { normalizedLabel -> choiceId } from survey elements.
 * Used for matching Formbricks response labels (which vary by language) to choice IDs.
 *
 * @param {Object} survey - Formbricks survey object (blocks/elements or questions)
 * @returns {Object} labelToChoiceIdMap
 */
export function buildLabelToChoiceIdMap(survey) {
  const labelToChoiceIdMap = {};
  const elements = survey.blocks?.flatMap(block => block.elements || []) || survey.questions || [];

  elements.forEach(element => {
    if (element.choices && Array.isArray(element.choices)) {
      const questionId = element.id;
      labelToChoiceIdMap[questionId] = {};
      element.choices.forEach(choice => {
        if (choice.label) {
          if (typeof choice.label === 'object' && choice.label !== null) {
            Object.values(choice.label).forEach(label => {
              if (label && typeof label === 'string') {
                labelToChoiceIdMap[questionId][label.toLowerCase().trim()] = choice.id;
              }
            });
          } else if (typeof choice.label === 'string') {
            labelToChoiceIdMap[questionId][choice.label.toLowerCase().trim()] = choice.id;
          }
        }
      });
    }
  });
  return labelToChoiceIdMap;
}

/**
 * Matches Formbricks response answers against CourseAddonMappings to find selected addons.
 * Supports multi-language surveys by mapping response labels to choice IDs.
 *
 * @param {Object} responseData - Formbricks response data object (contains localized labels)
 * @param {Array} addonMappings - Array of CourseAddonMapping objects (choiceId must be a Formbricks choice ID)
 * @param {Object} labelToChoiceIdMap - Map of questionId -> { normalizedLabel -> choiceId }
 * @param {Object} logger - Winston logger instance
 * @returns {Array} Array of selected addon objects with pricing
 */
export function matchAddonsFromResponse(responseData, addonMappings, labelToChoiceIdMap, logger) {
  const selectedAddons = [];

  for (const addonMapping of addonMappings) {
    const answerValue = responseData[addonMapping.questionId];

    if (answerValue === undefined || answerValue === null) continue;

    const questionLabelMap = labelToChoiceIdMap[addonMapping.questionId] || {};
    let isSelected = false;

    const resolveToChoiceId = (val) => {
      const normalizedLabel = String(val).trim().toLowerCase();
      const mappedChoiceId = questionLabelMap[normalizedLabel];
      return mappedChoiceId ?? val;
    };

    if (Array.isArray(answerValue)) {
      isSelected = answerValue.some(answer => {
        const choiceId = resolveToChoiceId(answer);
        return choiceId === addonMapping.choiceId || String(choiceId) === String(addonMapping.choiceId);
      });
    } else {
      const choiceId = resolveToChoiceId(answerValue);
      isSelected = choiceId === addonMapping.choiceId || String(choiceId) === String(addonMapping.choiceId);
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

  return selectedAddons;
}

/**
 * Shared Formbricks utilities for URL validation and extraction.
 * Enforces HTTPS, validates against trusted origins, and parses survey URL.
 * Used by createEnrollmentWithAddons, getFormbricksResponses, getFormbricksAddonSelections,
 * and validateFormbricksSurvey for consistent validation.
 *
 * @param {string} surveyUrl - The Formbricks survey URL to validate
 * @param {Object} logger - Winston logger instance for error logging
 * @returns {Object|null} Object with baseUrl and surveyId, or null if validation fails
 */
export function validateAndExtractFormbricksSurvey(surveyUrl, logger) {
  if (!surveyUrl) return null;

  try {
    const urlObj = new URL(surveyUrl);

    // 1. Enforce HTTPS only to prevent protocol smuggling and ensure encryption
    if (urlObj.protocol !== 'https:') {
      logger?.error('SSRF protection: Non-HTTPS URL rejected', { surveyUrl });
      return null;
    }

    // 2. Validate against trusted origins
    const trustedOrigins = [];
    if (process.env.FORMBRICKS_TRUSTED_ORIGINS) {
      const origins = process.env.FORMBRICKS_TRUSTED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
      for (const origin of origins) {
        try {
          const trustedUrl = new URL(origin);
          trustedOrigins.push(trustedUrl.origin);
        } catch (e) {
          logger?.warn('SSRF protection: Invalid trusted origin in FORMBRICKS_TRUSTED_ORIGINS', { origin });
        }
      }
    }
    const formbricksUrl = process.env.FORMBRICKS_API_URL || process.env.FORMBRICKS_BASE_URL;
    if (formbricksUrl) {
      try {
        const trustedUrl = new URL(formbricksUrl);
        trustedOrigins.push(trustedUrl.origin);
      } catch (e) {
        logger?.warn('SSRF protection: Invalid FORMBRICKS_API_URL or FORMBRICKS_BASE_URL', { url: formbricksUrl });
      }
    }

    if (trustedOrigins.length === 0) {
      logger?.error('SSRF protection: No trusted origins configured. Set FORMBRICKS_API_URL, FORMBRICKS_BASE_URL, or FORMBRICKS_TRUSTED_ORIGINS');
      return null;
    }

    const originMatch = trustedOrigins.includes(urlObj.origin);
    if (!originMatch) {
      logger?.error('SSRF protection: Untrusted origin rejected', {
        surveyUrl,
        origin: urlObj.origin,
        trustedOrigins
      });
      return null;
    }

    // 3. Validate path pattern: must be /s/{surveyId}
    const pathMatch = urlObj.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)$/);
    if (!pathMatch) {
      logger?.error('SSRF protection: Invalid path pattern', {
        surveyUrl,
        pathname: urlObj.pathname,
        expectedPattern: '/s/{surveyId}'
      });
      return null;
    }

    const surveyId = pathMatch[1];
    const baseUrl = urlObj.origin;
    return { baseUrl, surveyId };
  } catch (error) {
    logger?.error('SSRF protection: URL parsing failed', {
      surveyUrl,
      error: error.message
    });
    return null;
  }
}
