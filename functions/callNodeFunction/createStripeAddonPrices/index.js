import Stripe from 'stripe';
import { GraphQLClient } from 'graphql-request';

/**
 * Creates Stripe Products and Prices programmatically for validated add-ons.
 * Uses deterministic product IDs for idempotency.
 * 
 * @param {Object} req - Request object containing body with courseId and mappings array
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Created Stripe product and price IDs
 */
export default async function createStripeAddonPrices(req, logger) {
  logger.info("########## Create Stripe Addon Prices ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { courseId, mappings } = req.body.input || req.body;

    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required',
        messageKey: 'MISSING_COURSE_ID'
      };
    }

    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return {
        success: false,
        error: 'Mappings array is required',
        messageKey: 'MISSING_MAPPINGS'
      };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      logger.error('Stripe secret key missing');
      return {
        success: false,
        error: 'Stripe secret key not configured',
        messageKey: 'STRIPE_NOT_CONFIGURED'
      };
    }

    const stripe = new Stripe(stripeSecretKey);
    
    // Setup Hasura client for database operations
    const hasuraClient = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const CHECK_EXISTING_MAPPING = `
      query CheckExistingMapping($courseId: Int!, $questionId: String!) {
        CourseAddonMapping(
          where: {
            courseId: { _eq: $courseId },
            questionId: { _eq: $questionId }
          }
        ) {
          id
          choiceId
        }
      }
    `;

    const INSERT_ADDON_MAPPING = `
      mutation InsertAddonMapping($mapping: CourseAddonMapping_insert_input!) {
        insert_CourseAddonMapping_one(object: $mapping) {
          id
        }
      }
    `;


    const results = [];

    for (const mapping of mappings) {
      const {
        questionId,
        choiceId,
        description,
        validatedPrice,
        currency = 'eur'
      } = mapping;

      if (!questionId || !choiceId || !description || validatedPrice === undefined) {
        logger.warn('Skipping invalid mapping', { mapping });
        continue;
      }

      // Create deterministic product ID: addon_{courseId}_{questionId}_{choiceId}
      const productId = `addon_${courseId}_${questionId}_${choiceId}`;

      try {
        // Try to retrieve existing product
        let product;
        try {
          product = await stripe.products.retrieve(productId);
          logger.debug('Retrieved existing Stripe product', { productId });
        } catch (retrieveError) {
          // Product doesn't exist, create it
          if (retrieveError.code === 'resource_missing') {
            product = await stripe.products.create({
              id: productId,
              name: description,
              metadata: {
                courseId: String(courseId),
                questionId: questionId,
                choiceId: choiceId,
                source: 'eduhub_formbricks'
              }
            });
            logger.info('Created Stripe product', { productId, name: description });
          } else {
            throw retrieveError;
          }
        }

        // Check if we need to create a new price (if price changed)
        let priceId = mapping.stripePriceId;
        let shouldCreateNewPrice = true;

        if (priceId) {
          try {
            const existingPrice = await stripe.prices.retrieve(priceId);
            // If price matches, reuse it
            if (existingPrice.unit_amount === validatedPrice && 
                existingPrice.currency === currency.toLowerCase() &&
                existingPrice.active) {
              shouldCreateNewPrice = false;
              logger.debug('Reusing existing Stripe price', { priceId });
            } else {
              // Archive old price if amount changed
              await stripe.prices.update(priceId, { active: false });
              logger.info('Archived old Stripe price', { priceId });
            }
          } catch (priceError) {
            // Price doesn't exist or is invalid, create new one
            logger.debug('Existing price not found or invalid', { priceId });
          }
        }

        // Create new price if needed
        if (shouldCreateNewPrice) {
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: validatedPrice,
            currency: currency.toLowerCase(),
            metadata: {
              courseId: String(courseId),
              questionId: questionId,
              choiceId: choiceId,
              validatedAt: new Date().toISOString()
            }
          });
          priceId = price.id;
          logger.info('Created Stripe price', { 
            priceId, 
            amount: validatedPrice, 
            currency 
          });
        }

        // Insert or update database record
        try {
          // Check if mapping already exists (query by courseId and questionId, then filter by choiceId in code)
          const existingCheck = await hasuraClient.request(CHECK_EXISTING_MAPPING, {
            courseId,
            questionId
          });

          // Filter to find exact match including choiceId
          const existingMapping = existingCheck.CourseAddonMapping?.find(
            (m) => m.choiceId === choiceId
          );

          const mappingData = {
            courseId,
            questionId,
            choiceId,
            questionTextDe: mapping.questionTextDe || null,
            questionTextEn: mapping.questionTextEn || null,
            extractedPrice: mapping.extractedPrice,
            validatedPrice: validatedPrice,
            currency: currency.toUpperCase(),
            description: description,
            stripeProductId: product.id,
            stripePriceId: priceId,
            confidence: mapping.confidence || 'high',
            validatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (existingMapping) {
            // Update existing record - use id for update since choiceId might not be queryable
            const UPDATE_BY_ID = `
              mutation UpdateAddonMappingById($id: Int!, $updates: CourseAddonMapping_set_input!) {
                update_CourseAddonMapping_by_pk(pk_columns: { id: $id }, _set: $updates) {
                  id
                }
              }
            `;
            await hasuraClient.request(UPDATE_BY_ID, {
              id: existingMapping.id,
              updates: {
                questionTextDe: mappingData.questionTextDe,
                questionTextEn: mappingData.questionTextEn,
                extractedPrice: mappingData.extractedPrice,
                validatedPrice: mappingData.validatedPrice,
                currency: mappingData.currency,
                description: mappingData.description,
                stripeProductId: mappingData.stripeProductId,
                stripePriceId: mappingData.stripePriceId,
                confidence: mappingData.confidence,
                validatedAt: mappingData.validatedAt,
                updated_at: mappingData.updated_at,
              }
            });
            logger.debug('Updated existing addon mapping in database', {
              courseId,
              questionId,
              choiceId,
              id: existingMapping.id
            });
          } else {
            // Insert new record
            await hasuraClient.request(INSERT_ADDON_MAPPING, {
              mapping: mappingData
            });
            logger.debug('Inserted new addon mapping in database', {
              courseId,
              questionId,
              choiceId
            });
          }
          
          // Database operation succeeded, add success result
          results.push({
            questionId,
            choiceId,
            stripeProductId: product.id,
            stripePriceId: priceId,
            success: true
          });
        } catch (dbError) {
          logger.error('Error inserting addon mapping into database', {
            courseId,
            questionId,
            choiceId,
            error: dbError.message,
            stack: dbError.stack,
            mappingData: {
              questionTextDe: mapping.questionTextDe,
              questionTextEn: mapping.questionTextEn,
              extractedPrice: mapping.extractedPrice,
              validatedPrice: validatedPrice,
              currency: currency.toUpperCase(),
              description: description,
              confidence: mapping.confidence || 'high',
            }
          });
          // Stripe product/price was created successfully, but database insert failed
          // Mark as success for Stripe but include database error in error field
          results.push({
            questionId,
            choiceId,
            stripeProductId: product.id,
            stripePriceId: priceId,
            success: true, // Stripe operations succeeded
            error: `Database insert failed: ${dbError.message}` // But database failed
          });
        }

      } catch (error) {
        logger.error('Error creating Stripe product/price', {
          questionId,
          choiceId,
          error: error.message,
          stack: error.stack
        });

        results.push({
          questionId,
          choiceId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Stripe price creation complete', {
      courseId,
      total: mappings.length,
      success: successCount,
      failures: failureCount
    });

    return {
      success: successCount > 0,
      messageKey: successCount > 0 ? 'STRIPE_PRICES_CREATED_SUCCESS' : 'STRIPE_PRICES_CREATION_PARTIAL_FAILURE',
      error: null,
      stripeResults: {
        success: successCount > 0,
        results,
        summary: {
          total: mappings.length,
          success: successCount,
          failures: failureCount
        }
      }
    };

  } catch (error) {
    logger.error('Error in createStripeAddonPrices', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'STRIPE_CREATION_ERROR',
      stripeResults: null
    };
  }
}

