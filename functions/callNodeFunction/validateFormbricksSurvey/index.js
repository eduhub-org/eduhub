/**
 * Extracts the base URL and survey ID from a Formbricks survey URL.
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
  const patterns = [
    // Symbol before: €15.00, €15,00, $15.00, £15.00
    /([€$£])\s*(\d+)[.,](\d{2})/,
    // Symbol after: 15.00€, 15,00 €, 15.00$
    /(\d+)[.,](\d{2})\s*([€$£])/,
    // Without decimals: €15, 15€, $15
    /([€$£])\s*(\d+)(?![.,]\d)/,
    /(\d+)\s*([€$£])(?![.,]\d)/,
    // CHF format
    /(CHF)\s*(\d+)[.,]?(\d{2})?/,
    /(\d+)[.,]?(\d{2})?\s*(CHF)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let currencySymbol, major, minor;

      if (match[0].includes('CHF')) {
        // Handle CHF separately
        currencySymbol = match[1] === 'CHF' ? 'CHF' : match[3];
        major = match[1] === 'CHF' ? match[2] : match[1];
        minor = match[1] === 'CHF' ? (match[3] || '00') : (match[2] || '00');
      } else {
        // Regular currency symbols
        currencySymbol = match[1] || match[3] || match[6];
        major = match[2] || match[4];
        minor = match[3] || match[5] || '00';
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
 * Analyzes a question to determine if it's an add-on question and extracts pricing info.
 * 
 * @param {Object} question - Formbricks question object
 * @returns {Object|null} Add-on data or null if not an add-on question
 */
function analyzeQuestionForAddon(question) {
  if (!question || !question.headline) return null;

  // Get all language versions of the question text
  const allLanguageTexts = typeof question.headline === 'string' 
    ? { default: question.headline }
    : question.headline;

  const extractedPrices = [];
  const warnings = [];

  // Extract prices from all language versions
  for (const [lang, text] of Object.entries(allLanguageTexts)) {
    const priceInfo = extractPriceAndCurrency(text);
    if (priceInfo) {
      extractedPrices.push({
        language: lang,
        ...priceInfo,
        originalText: text
      });
    }
  }

  // No prices found - not an add-on question
  if (extractedPrices.length === 0) {
    return null;
  }

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

  return {
    price,
    currency,
    confidence,
    warnings,
    allPrices: extractedPrices,
    description
  };
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

    // Extract base URL and survey ID
    const urlParts = extractFormbricksBaseUrlAndSurveyId(surveyUrl);
    if (!urlParts) {
      logger.error('Invalid Formbricks survey URL', { surveyUrl });
      return {
        success: false,
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

    const surveyResponse = await fetch(surveyUrl_api, {
      method: 'GET',
      headers: {
        'x-api-key': formbricksApiKey,
        'Content-Type': 'application/json'
      }
    });

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
      questionCount: survey.questions?.length || 0
    });

    // Analyze all questions for add-ons
    const questions = survey.questions || [];
    const addonQuestions = [];

    for (const question of questions) {
      const addonData = analyzeQuestionForAddon(question);
      if (addonData) {
        // Get question text in all languages
        const questionTexts = typeof question.headline === 'string'
          ? { default: question.headline }
          : question.headline;

        addonQuestions.push({
          questionId: question.id,
          questionType: question.type || 'unknown',
          questionText: JSON.stringify(questionTexts),
          extractedPrice: addonData.price,
          extractedCurrency: addonData.currency,
          confidence: addonData.confidence,
          warnings: addonData.warnings,
          allDetectedPrices: addonData.allPrices,
          description: addonData.description
        });
      }
    }

    logger.info('Survey validation complete', {
      surveyId: formbricksSurveyId,
      addonCount: addonQuestions.length,
      requiresReview: addonQuestions.some(q => q.confidence !== 'high')
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

