/**
 * Extracts the base URL and survey ID from a Formbricks survey URL.
 * Includes SSRF protection: enforces HTTPS, validates against trusted origins,
 * and ensures path matches expected pattern (/s/{id}).
 * 
 * @param {string} surveyUrl - The Formbricks survey URL to validate
 * @param {Object} logger - Winston logger instance for error logging
 * @returns {Object|null} Object with baseUrl and surveyId, or null if validation fails
 */
function extractFormbricksBaseUrlAndSurveyId(surveyUrl, logger) {
  if (!surveyUrl) return null;

  try {
    const urlObj = new URL(surveyUrl);

    // 1. Enforce HTTPS only to prevent protocol smuggling and ensure encryption
    if (urlObj.protocol !== 'https:') {
      logger?.error('SSRF protection: Non-HTTPS URL rejected', { surveyUrl });
      return null;
    }

    // 2. Validate against trusted origins
    // Support both FORMBRICKS_BASE_URL (single) and FORMBRICKS_TRUSTED_ORIGINS (comma-separated)
    const trustedOrigins = [];
    
    if (process.env.FORMBRICKS_TRUSTED_ORIGINS) {
      // Parse comma-separated list
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
    
    if (process.env.FORMBRICKS_BASE_URL) {
      try {
        const trustedUrl = new URL(process.env.FORMBRICKS_BASE_URL);
        trustedOrigins.push(trustedUrl.origin);
      } catch (e) {
        logger?.warn('SSRF protection: Invalid FORMBRICKS_BASE_URL', { url: process.env.FORMBRICKS_BASE_URL });
      }
    }

    if (trustedOrigins.length === 0) {
      logger?.error('SSRF protection: No trusted origins configured. Set FORMBRICKS_BASE_URL or FORMBRICKS_TRUSTED_ORIGINS');
      return null;
    }

    // Check if the provided URL's origin matches any trusted origin
    const originMatch = trustedOrigins.includes(urlObj.origin);
    if (!originMatch) {
      logger?.error('SSRF protection: Untrusted origin rejected', {
        surveyUrl,
        origin: urlObj.origin,
        trustedOrigins
      });
      return null;
    }

    // 3. Validate path pattern: must be /s/{surveyId} (Link Survey format)
    // Allow alphanumeric, hyphens, and underscores in survey ID
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

/**
 * Extracts price and currency from question text using regex patterns.
 * Supports multiple formats: €15.00, €15,00, 15.00€, 15,00 €, $15.00, £15.00, etc.
 * 
 * @param {string} text - Question text to parse
 * @returns {Object|null} Object with priceInCents and currency, or null if no price found
 */
function extractPriceAndCurrency(text) {
  if (!text || typeof text !== 'string') return null;

  const currencySymbols = {
    '€': 'eur',
    '$': 'usd',
    '£': 'gbp',
    'CHF': 'chf'
  };

  // Patterns to match various price formats
  // Note: These patterns will match prices even when inside parentheses like "(150 €)"
  const patterns = [
    // Symbol before: €15.00, €15,00, $15.00, £15.00, €150
    /([€$£])\s*(\d+)[.,](\d{2})/,
    // Symbol after with decimals: 15.00€, 15,00 €, 15.00$
    /(\d+)[.,](\d{2})\s*([€$£])/,
    // Symbol before without decimals: €15, €150, $15
    /([€$£])\s*(\d+)(?![.,]\d)/,
    // Symbol after without decimals: 15€, 150 €, 15$ (matches "150 €" in "(150 €)")
    /(\d+)\s*([€$£])(?![.,]\d)/,
    // CHF format
    /(CHF)\s*(\d+)[.,]?(\d{2})?/,
    /(\d+)[.,]?(\d{2})?\s*(CHF)/
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = text.match(pattern);
    if (match) {
      let currencySymbol, major, minor;

      if (match[0].includes('CHF')) {
        // Handle CHF separately
        currencySymbol = match[1] === 'CHF' ? 'CHF' : match[3];
        major = match[1] === 'CHF' ? match[2] : match[1];
        minor = match[1] === 'CHF' ? (match[3] || '00') : (match[2] || '00');
      } else {
        // Pattern index determines the structure:
        // 0: /([€$£])\s*(\d+)[.,](\d{2})/ - Symbol before with decimals
        // 1: /(\d+)[.,](\d{2})\s*([€$£])/ - Number with decimals, symbol after
        // 2: /([€$£])\s*(\d+)(?![.,]\d)/ - Symbol before without decimals
        // 3: /(\d+)\s*([€$£])(?![.,]\d)/ - Number without decimals, symbol after
        if (i === 0) {
          // Symbol before with decimals: €15.00
          currencySymbol = match[1];
          major = match[2];
          minor = match[3];
        } else if (i === 1) {
          // Number with decimals, symbol after: 15.00€
          currencySymbol = match[3];
          major = match[1];
          minor = match[2];
        } else if (i === 2) {
          // Symbol before without decimals: €15
          currencySymbol = match[1];
          major = match[2];
          minor = '00';
        } else if (i === 3) {
          // Number without decimals, symbol after: 15€ or 150 €
          currencySymbol = match[2];
          major = match[1];
          minor = '00';
        } else {
          // Fallback (shouldn't happen)
          currencySymbol = match[1] || match[3] || match[6];
          major = match[2] || match[4];
          minor = match[3] || match[5] || '00';
        }
      }

      const currency = currencySymbols[currencySymbol] || 'eur';
      const priceInCents = parseInt(major) * 100 + parseInt(minor);

      return {
        priceInCents,
        currency
      };
    }
  }

  return null;
}

/**
 * Analyzes a question to determine if it contains add-on choices and extracts pricing info.
 * For multiple choice questions, checks each choice for prices.
 * 
 * @param {Object} question - Formbricks question object
 * @returns {Array} Array of add-on data objects (one per choice with price), or empty array
 */
function analyzeQuestionForAddons(question) {
  if (!question) return [];

  const addons = [];

  // Check if this is a multiple choice question with choices
  const isMultipleChoice = question.type === 'multipleChoiceSingle' || 
                           question.type === 'multipleChoiceMulti';
  
  if (isMultipleChoice && question.choices && Array.isArray(question.choices)) {
    // Process each choice as a potential add-on
    for (const choice of question.choices) {
      if (!choice || !choice.label) continue;

      // Get all language versions of the choice label
      const allLanguageTexts = typeof choice.label === 'string' 
        ? { default: choice.label }
        : choice.label;

      const extractedPrices = [];
      const warnings = [];

      // Extract prices from all language versions
      for (const [lang, text] of Object.entries(allLanguageTexts)) {
        if (!text || typeof text !== 'string') continue;
        
        const priceInfo = extractPriceAndCurrency(text);
        if (priceInfo) {
          extractedPrices.push({
            language: lang,
            ...priceInfo,
            originalText: text
          });
        }
      }

      // If this choice has a price, it's an add-on
      if (extractedPrices.length > 0) {
        // Check consistency across languages
        const uniquePrices = [...new Set(extractedPrices.map(p => p.priceInCents))];
        const uniqueCurrencies = [...new Set(extractedPrices.map(p => p.currency))];

        if (uniquePrices.length > 1) {
          warnings.push({
            type: 'inconsistent_prices',
            message: `Different prices found across languages: ${uniquePrices.map(p => p / 100).join(', ')}`,
            severity: 'high'
          });
        }

        if (uniqueCurrencies.length > 1) {
          warnings.push({
            type: 'inconsistent_currencies',
            message: `Different currencies found: ${uniqueCurrencies.join(', ')}`,
            severity: 'medium'
          });
        }

        // Determine confidence level
        let confidence = 'high';
        if (warnings.length > 0) {
          confidence = warnings.some(w => w.severity === 'high') ? 'low' : 'medium';
        }

        // Use the most common price/currency, or first one if tied
        const price = uniquePrices[0];
        const currency = uniqueCurrencies[0];

        // Extract description (remove price part)
        const firstText = Object.values(allLanguageTexts)[0];
        const description = firstText
          .replace(/\([^)]*[€$£][^)]*\)/g, '') // Remove (price) part
          .replace(/\+/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        addons.push({
          choiceId: choice.id,
          price,
          currency,
          confidence,
          warnings,
          allPrices: extractedPrices,
          description
        });
      }
    }
  }

  return addons;
}

/**
 * Validates a Formbricks survey and extracts add-on questions with pricing information.
 * 
 * @param {Object} req - Request object containing body with surveyUrl and courseId
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Validation results with detected add-ons
 */
export default async function validateFormbricksSurvey(req, logger) {
  logger.info("########## Validate Formbricks Survey ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { surveyUrl, courseId } = req.body.input || req.body;

    if (!surveyUrl) {
      return {
        success: false,
        error: 'Survey URL is required',
        messageKey: 'MISSING_SURVEY_URL'
      };
    }

    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required',
        messageKey: 'MISSING_COURSE_ID'
      };
    }

    // Extract base URL and survey ID with SSRF protection
    const urlParts = extractFormbricksBaseUrlAndSurveyId(surveyUrl, logger);
    if (!urlParts) {
      // Error already logged by extractFormbricksBaseUrlAndSurveyId
      // Check if it's a configuration issue (no trusted origins) vs invalid URL
      const hasTrustedOrigins = !!(process.env.FORMBRICKS_BASE_URL || process.env.FORMBRICKS_TRUSTED_ORIGINS);
      return {
        success: false,
        error: hasTrustedOrigins 
          ? 'Invalid Formbricks survey URL format or untrusted origin'
          : 'Formbricks not configured: missing FORMBRICKS_BASE_URL or FORMBRICKS_TRUSTED_ORIGINS',
        messageKey: hasTrustedOrigins ? 'INVALID_SURVEY_URL' : 'FORMBRICKS_NOT_CONFIGURED'
      };
    }

    const { baseUrl: formbricksApiUrl, surveyId: formbricksSurveyId } = urlParts;
    const formbricksApiKey = process.env.FORMBRICKS_API_KEY;

    if (!formbricksApiKey) {
      logger.error('Formbricks API key missing');
      return {
        success: false,
        error: 'Formbricks API key not configured',
        messageKey: 'FORMBRICKS_NOT_CONFIGURED'
      };
    }

    // Fetch survey from Formbricks
    const surveyUrl_api = `${formbricksApiUrl}/api/v1/management/surveys/${formbricksSurveyId}`;
    logger.debug('Fetching survey from Formbricks', { 
      surveyUrl: surveyUrl_api,
      surveyId: formbricksSurveyId
    });

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout

    let surveyResponse;
    try {
      surveyResponse = await fetch(surveyUrl_api, {
        method: 'GET',
        headers: {
          'x-api-key': formbricksApiKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
    } catch (error) {
      // Clear timeout timer since fetch completed (with error)
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout)
      if (error.name === 'AbortError') {
        logger.error('Formbricks request timed out after 10 seconds', {
          surveyUrl: surveyUrl_api,
          surveyId: formbricksSurveyId,
          error: error.message
        });
        return {
          success: false,
          error: 'Formbricks request timed out after 10 seconds. Please check your network connection and try again.',
          messageKey: 'FORMBRICKS_TIMEOUT'
        };
      }
      
      // Handle other fetch errors
      logger.error('Failed to fetch survey from Formbricks', {
        surveyUrl: surveyUrl_api,
        surveyId: formbricksSurveyId,
        error: error.message,
        errorName: error.name,
        stack: error.stack
      });
      return {
        success: false,
        error: `Failed to fetch survey from Formbricks: ${error.message}`,
        messageKey: 'FORMBRICKS_FETCH_ERROR'
      };
    }
    
    // Clear timeout timer since fetch completed successfully
    clearTimeout(timeoutId);

    if (!surveyResponse.ok) {
      const errorText = await surveyResponse.text();
      logger.error(`Failed to fetch survey: ${surveyResponse.status}`, { errorText });
      
      if (surveyResponse.status === 401) {
        return {
          success: false,
          error: 'Formbricks API authentication failed. Please verify your API key has read permissions.',
          messageKey: 'FORMBRICKS_AUTH_ERROR'
        };
      }

      return {
        success: false,
        error: `Failed to fetch survey: ${surveyResponse.status} - ${errorText}`,
        messageKey: 'FORMBRICKS_FETCH_ERROR'
      };
    }

    const surveyData = await surveyResponse.json();
    const survey = surveyData.data || surveyData;

    logger.debug('Survey structure', {
      surveyId: survey.id,
      surveyName: survey.name,
      hasQuestions: !!survey.questions,
      hasBlocks: !!survey.blocks,
      questionCount: survey.questions?.length || 0,
      blockCount: survey.blocks?.length || 0,
      surveyKeys: Object.keys(survey)
    });

    // Formbricks API might return questions in blocks or directly in questions array
    // Extract questions from blocks if available, otherwise use questions array
    let questions = [];
    if (survey.blocks && Array.isArray(survey.blocks)) {
      // Extract questions from blocks
      for (const block of survey.blocks) {
        if (block.elements && Array.isArray(block.elements)) {
          questions.push(...block.elements);
        }
      }
    } else if (survey.questions && Array.isArray(survey.questions)) {
      questions = survey.questions;
    }

    logger.debug('Extracted questions', {
      questionCount: questions.length,
      questionTypes: questions.map(q => ({ id: q.id, type: q.type, hasChoices: !!q.choices, choicesCount: q.choices?.length || 0 }))
    });

    const addonQuestions = [];

    for (const question of questions) {
      logger.debug('Analyzing question', {
        questionId: question.id,
        questionType: question.type,
        hasChoices: !!question.choices,
        choicesCount: question.choices?.length || 0,
        choices: question.choices?.map(c => ({
          id: c.id,
          label: typeof c.label === 'string' ? c.label : Object.keys(c.label || {})
        }))
      });
      
      const addons = analyzeQuestionForAddons(question);
      
      logger.debug('Addons found for question', {
        questionId: question.id,
        addonCount: addons.length
      });
      
      if (addons.length > 0) {
        // Get question text in all languages
        const questionTexts = typeof question.headline === 'string'
          ? { default: question.headline }
          : question.headline;

        // Create one add-on entry per choice
        for (const addonData of addons) {
          addonQuestions.push({
            questionId: question.id,
            choiceId: addonData.choiceId,
            questionType: question.type || 'unknown',
            questionText: questionTexts,
            extractedPrice: addonData.price,
            extractedCurrency: addonData.currency,
            confidence: addonData.confidence,
            warnings: addonData.warnings,
            allDetectedPrices: addonData.allPrices,
            description: addonData.description
          });
        }
      }
    }

    logger.info('Survey validation complete', {
      surveyId: formbricksSurveyId,
      addonCount: addonQuestions.length,
      requiresReview: addonQuestions.some(q => q.confidence !== 'high'),
      // Debug: log first question structure if no addons found
      debugInfo: addonQuestions.length === 0 && questions.length > 0 ? {
        firstQuestion: {
          id: questions[0].id,
          type: questions[0].type,
          headline: questions[0].headline,
          hasChoices: !!questions[0].choices,
          choicesCount: questions[0].choices?.length || 0,
          firstChoice: questions[0].choices?.[0] ? {
            id: questions[0].choices[0].id,
            label: questions[0].choices[0].label
          } : null
        }
      } : null
    });

    return {
      success: true,
      surveyId: formbricksSurveyId,
      surveyTitle: survey.name || 'Unknown Survey',
      addonQuestions,
      requiresReview: addonQuestions.some(q => q.confidence !== 'high')
    };

  } catch (error) {
    logger.error('Error validating Formbricks survey', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'VALIDATION_ERROR'
    };
  }
}

