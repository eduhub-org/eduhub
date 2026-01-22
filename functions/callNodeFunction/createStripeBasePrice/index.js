import Stripe from 'stripe';
import { GraphQLClient } from 'graphql-request';

/**
 * Creates or updates Stripe Product and Price for a course's base price.
 * Uses deterministic product IDs for idempotency.
 * Archives old prices when price changes.
 * 
 * @param {Object} req - Request object containing body with courseId, basePrice, currency, courseTitle
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Created/updated Stripe product and price IDs
 */
export default async function createStripeBasePrice(req, logger) {
  logger.info("########## Create Stripe Base Price ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { courseId, basePrice, currency = 'eur', courseTitle } = req.body.input || req.body;

    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required',
        messageKey: 'MISSING_COURSE_ID'
      };
    }

    if (basePrice === undefined || basePrice === null) {
      return {
        success: false,
        error: 'Base price is required',
        messageKey: 'MISSING_BASE_PRICE'
      };
    }

    if (basePrice < 0) {
      return {
        success: false,
        error: 'Base price must be non-negative',
        messageKey: 'INVALID_BASE_PRICE'
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

    // Fetch current course data to check existing Stripe IDs
    const GET_COURSE = `
      query GetCourse($courseId: Int!) {
        Course_by_pk(id: $courseId) {
          id
          title
          basePrice
          currency
          stripeProductId
          stripePriceId
        }
      }
    `;

    const courseData = await hasuraClient.request(GET_COURSE, { courseId });
    const course = courseData.Course_by_pk;

    if (!course) {
      return {
        success: false,
        error: 'Course not found',
        messageKey: 'COURSE_NOT_FOUND'
      };
    }

    const finalTitle = courseTitle || course.title || 'Course Enrollment';
    const finalCurrency = (currency || course.currency || 'eur').toLowerCase();

    // Create deterministic product ID: course_{courseId}
    const productId = `course_${courseId}`;

    try {
      // Try to retrieve existing product
      let product;
      try {
        product = await stripe.products.retrieve(productId);
        logger.debug('Retrieved existing Stripe product', { productId });

        // Update product name if course title changed
        if (product.name !== finalTitle) {
          product = await stripe.products.update(productId, {
            name: finalTitle,
            metadata: {
              courseId: String(courseId),
              source: 'eduhub',
              updatedAt: new Date().toISOString()
            }
          });
          logger.info('Updated Stripe product name', { productId, name: finalTitle });
        }
      } catch (retrieveError) {
        // Product doesn't exist, create it
        if (retrieveError.code === 'resource_missing') {
          product = await stripe.products.create({
            id: productId,
            name: finalTitle,
            metadata: {
              courseId: String(courseId),
              source: 'eduhub',
              createdAt: new Date().toISOString()
            }
          });
          logger.info('Created Stripe product', { productId, name: finalTitle });
        } else {
          throw retrieveError;
        }
      }

      // Check if we need to create a new price (if price changed or doesn't exist)
      let priceId = course.stripePriceId;
      let shouldCreateNewPrice = true;

      if (priceId && basePrice > 0) {
        try {
          const existingPrice = await stripe.prices.retrieve(priceId);
          // If price matches, reuse it
          if (existingPrice.unit_amount === basePrice && 
              existingPrice.currency === finalCurrency &&
              existingPrice.active) {
            shouldCreateNewPrice = false;
            logger.debug('Reusing existing Stripe price', { priceId });
          } else {
            // Archive old price if amount or currency changed
            await stripe.prices.update(priceId, { active: false });
            logger.info('Archived old Stripe price', { priceId, reason: 'Price or currency changed' });
          }
        } catch (priceError) {
          // Price doesn't exist or is invalid, create new one
          logger.debug('Existing price not found or invalid', { priceId });
        }
      }

      // Create new price if needed (or if basePrice is 0, we don't create a price)
      if (shouldCreateNewPrice && basePrice > 0) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: basePrice,
          currency: finalCurrency,
          metadata: {
            courseId: String(courseId),
            source: 'eduhub',
            createdAt: new Date().toISOString()
          }
        });
        priceId = price.id;
        logger.info('Created Stripe price', { 
          priceId, 
          amount: basePrice, 
          currency: finalCurrency 
        });
      } else if (basePrice === 0) {
        // If base price is 0, we don't need a Stripe price
        priceId = null;
        logger.info('Base price is 0, no Stripe price needed', { courseId });
      }

      // Update course record with Stripe IDs
      const UPDATE_COURSE = `
        mutation UpdateCourse($courseId: Int!, $stripeProductId: String, $stripePriceId: String) {
          update_Course_by_pk(
            pk_columns: { id: $courseId }
            _set: {
              stripeProductId: $stripeProductId
              stripePriceId: $stripePriceId
            }
          ) {
            id
            stripeProductId
            stripePriceId
          }
        }
      `;

      try {
        await hasuraClient.request(UPDATE_COURSE, {
          courseId,
          stripeProductId: product.id,
          stripePriceId: priceId
        });

        logger.info('Updated course with Stripe IDs', {
          courseId,
          stripeProductId: product.id,
          stripePriceId: priceId
        });
      } catch (dbError) {
        logger.error('Error updating course with Stripe IDs', {
          courseId,
          error: dbError.message
        });
        // Continue even if DB update fails - Stripe product/price was created
      }

      return {
        success: true,
        messageKey: 'STRIPE_BASE_PRICE_CREATED_SUCCESS',
        stripeProductId: product.id,
        stripePriceId: priceId,
        productName: finalTitle,
        priceAmount: basePrice,
        currency: finalCurrency
      };

    } catch (error) {
      logger.error('Error creating Stripe product/price', {
        courseId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message || 'Failed to create Stripe product/price',
        messageKey: 'STRIPE_CREATION_ERROR'
      };
    }

  } catch (error) {
    logger.error('Error in createStripeBasePrice', {
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
