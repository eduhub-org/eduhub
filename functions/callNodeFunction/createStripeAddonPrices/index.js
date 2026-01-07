import Stripe from 'stripe';

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
    const results = [];

    for (const mapping of mappings) {
      const {
        questionId,
        description,
        validatedPrice,
        currency = 'eur'
      } = mapping;

      if (!questionId || !description || validatedPrice === undefined) {
        logger.warn('Skipping invalid mapping', { mapping });
        continue;
      }

      // Create deterministic product ID: addon_{courseId}_{questionId}
      const productId = `addon_${courseId}_${questionId}`;

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

        results.push({
          questionId,
          stripeProductId: product.id,
          stripePriceId: priceId,
          success: true
        });

      } catch (error) {
        logger.error('Error creating Stripe product/price', {
          questionId,
          error: error.message,
          stack: error.stack
        });

        results.push({
          questionId,
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
      results,
      summary: {
        total: mappings.length,
        success: successCount,
        failures: failureCount
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
      messageKey: 'STRIPE_CREATION_ERROR'
    };
  }
}

