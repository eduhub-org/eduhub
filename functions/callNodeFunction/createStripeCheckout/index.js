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
        choiceId
        validatedPrice
        currency
        stripeProductId
        stripePriceId
      }
    }
  }
`;

const GET_ENROLLMENT_USER = `
  query GetEnrollmentUser($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      userId
      User {
        email
      }
    }
  }
`;

/**
 * Creates a Stripe Checkout Session for course enrollment with add-ons.
 * Builds success and cancel URLs server-side from FRONTEND_URL for security.
 * 
 * @param {Object} req - Request object containing body with courseId, enrollmentId, formbricksResponseId, selectedAddons
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

    // Build URLs server-side from trusted FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      logger.error('FRONTEND_URL environment variable not configured');
      return {
        success: false,
        error: 'Frontend URL not configured',
        messageKey: 'FRONTEND_URL_NOT_CONFIGURED'
      };
    }

    // Build success and cancel URLs server-side
    const successUrl = `${frontendUrl}/course/${courseId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/course/${courseId}/payment-cancelled`;

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

    // Fetch enrollment to get user email if not provided
    let emailToUse = userEmail;
    if (!emailToUse || emailToUse.trim() === '') {
      try {
        const enrollmentData = await client.request(GET_ENROLLMENT_USER, { enrollmentId });
        const enrollment = enrollmentData.CourseEnrollment_by_pk;
        if (enrollment?.User?.email) {
          emailToUse = enrollment.User.email;
        }
      } catch (error) {
        logger.warn('Could not fetch user email from enrollment', { error: error.message });
        // Continue without email - Stripe will prompt for it during checkout
      }
    }

    // Build line items array
    const lineItems = [];

    // Add base course price if it exists
    if (course.basePrice && course.basePrice > 0) {
      if (course.stripePriceId) {
        // Verify the Stripe Price ID is valid and has correct amount
        try {
          const stripePrice = await stripe.prices.retrieve(course.stripePriceId);
          
          // Check if the Stripe price amount matches our basePrice (in cents)
          // If it doesn't match or is zero, fall back to dynamic pricing
          if (stripePrice.unit_amount && stripePrice.unit_amount > 0 && stripePrice.unit_amount === course.basePrice) {
            // Use existing Stripe Price ID
            lineItems.push({
              price: course.stripePriceId,
              quantity: 1
            });
            logger.debug('Using existing Stripe Price ID', {
              stripePriceId: course.stripePriceId,
              amount: stripePrice.unit_amount
            });
          } else {
            // Price ID exists but amount doesn't match or is invalid, use dynamic pricing
            logger.warn('Stripe Price ID amount mismatch or invalid, using dynamic pricing', {
              stripePriceId: course.stripePriceId,
              stripeAmount: stripePrice.unit_amount,
              expectedAmount: course.basePrice
            });
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
        } catch (error) {
          // Stripe Price ID doesn't exist or is invalid, fall back to dynamic pricing
          logger.warn('Stripe Price ID not found or invalid, using dynamic pricing', {
            stripePriceId: course.stripePriceId,
            error: error.message
          });
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
      } else {
        // Create dynamic price (no Stripe Price ID exists)
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
        logger.debug('Using dynamic pricing', {
          basePrice: course.basePrice,
          currency: course.currency || 'eur'
        });
      }
    }

    // Add selected add-ons as line items
    if (course.CourseAddonMappings && Array.isArray(course.CourseAddonMappings)) {
      for (const addonMapping of course.CourseAddonMappings) {
        // Check if this addon was selected in the Formbricks response
        // Match by both questionId and choiceId, and ensure selected flag is true
        const isSelected = selectedAddons.some(
          selected => selected.selected === true &&
                     selected.questionId === addonMapping.questionId &&
                     selected.choiceId === addonMapping.choiceId
        );

        if (isSelected && addonMapping.stripePriceId) {
          lineItems.push({
            price: addonMapping.stripePriceId,
            quantity: 1
          });
        }
      }
    }

    // Log line items for debugging
    logger.debug('Line items prepared', {
      lineItemCount: lineItems.length,
      courseBasePrice: course.basePrice,
      courseStripePriceId: course.stripePriceId,
      lineItems: lineItems.map(item => ({
        hasPrice: !!item.price,
        hasPriceData: !!item.price_data,
        unitAmount: item.price_data?.unit_amount
      }))
    });

    if (lineItems.length === 0) {
      return {
        success: false,
        error: 'No items to charge. Course has no base price and no add-ons selected.',
        messageKey: 'NO_ITEMS_TO_CHARGE'
      };
    }

    // Create Stripe Checkout Session
    // Only include customer_email if we have a valid email address
    // Stripe will prompt for email during checkout if not provided
    const sessionConfig = {
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        courseId: String(courseId),
        enrollmentId: String(enrollmentId),
        formbricksResponseId: formbricksResponseId || '',
        source: 'eduhub',
        selectedAddons: selectedAddons && selectedAddons.length > 0 ? JSON.stringify(selectedAddons) : ''
      },
      payment_intent_data: {
        metadata: {
          courseId: String(courseId),
          enrollmentId: String(enrollmentId)
        }
      }
    };

    // Only add customer_email if we have a valid email address
    if (emailToUse && emailToUse.trim() !== '' && emailToUse.includes('@')) {
      sessionConfig.customer_email = emailToUse.trim();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
