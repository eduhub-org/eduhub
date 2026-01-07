import Stripe from 'stripe';
import { GraphQLClient } from 'graphql-request';

const GET_COURSE_AND_ADDONS = `
  query GetCourseAndAddons($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      basePrice
      currency
      stripeProductId
      stripePriceId
      CourseAddonMappings {
        id
        questionId
        validatedPrice
        currency
        stripeProductId
        stripePriceId
      }
    }
  }
`;

/**
 * Creates a Stripe Checkout Session for course enrollment with add-ons.
 * 
 * @param {Object} req - Request object containing body with courseId, enrollmentId, formbricksResponseId, successUrl, cancelUrl, selectedAddons
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Checkout session URL
 */
export default async function createStripeCheckout(req, logger) {
  logger.info("########## Create Stripe Checkout ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const {
      courseId,
      enrollmentId,
      formbricksResponseId,
      successUrl,
      cancelUrl,
      userEmail,
      selectedAddons = []
    } = req.body.input || req.body;

    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required',
        messageKey: 'MISSING_COURSE_ID'
      };
    }

    if (!enrollmentId) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        messageKey: 'MISSING_ENROLLMENT_ID'
      };
    }

    if (!successUrl || !cancelUrl) {
      return {
        success: false,
        error: 'Success and cancel URLs are required',
        messageKey: 'MISSING_URLS'
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

    // Fetch course and addon mappings from Hasura
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const courseData = await client.request(GET_COURSE_AND_ADDONS, { courseId });
    const course = courseData.Course_by_pk;

    if (!course) {
      return {
        success: false,
        error: 'Course not found',
        messageKey: 'COURSE_NOT_FOUND'
      };
    }

    // Build line items array
    const lineItems = [];

    // Add base course price if it exists
    if (course.basePrice && course.basePrice > 0) {
      if (course.stripePriceId) {
        // Use existing Stripe Price ID
        lineItems.push({
          price: course.stripePriceId,
          quantity: 1
        });
      } else {
        // Create dynamic price (fallback)
        lineItems.push({
          price_data: {
            currency: (course.currency || 'eur').toLowerCase(),
            product_data: {
              name: course.title || 'Course Enrollment'
            },
            unit_amount: course.basePrice
          },
          quantity: 1
        });
      }
    }

    // Add selected add-ons as line items
    if (course.CourseAddonMappings && Array.isArray(course.CourseAddonMappings)) {
      for (const addonMapping of course.CourseAddonMappings) {
        // Check if this addon was selected in the Formbricks response
        const isSelected = selectedAddons.some(
          selected => selected.questionId === addonMapping.questionId
        );

        if (isSelected && addonMapping.stripePriceId) {
          lineItems.push({
            price: addonMapping.stripePriceId,
            quantity: 1
          });
        }
      }
    }

    if (lineItems.length === 0) {
      return {
        success: false,
        error: 'No items to charge. Course has no base price and no add-ons selected.',
        messageKey: 'NO_ITEMS_TO_CHARGE'
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        courseId: String(courseId),
        enrollmentId: String(enrollmentId),
        formbricksResponseId: formbricksResponseId || '',
        source: 'eduhub'
      },
      payment_intent_data: {
        metadata: {
          courseId: String(courseId),
          enrollmentId: String(enrollmentId)
        }
      }
    });

    logger.info('Created Stripe Checkout Session', {
      sessionId: session.id,
      courseId,
      enrollmentId,
      lineItemCount: lineItems.length
    });

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    };

  } catch (error) {
    logger.error('Error creating Stripe Checkout Session', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'CHECKOUT_CREATION_ERROR'
    };
  }
}

