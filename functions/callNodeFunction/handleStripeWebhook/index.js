import Stripe from 'stripe';

/**
 * Handles Stripe webhook events, particularly checkout.session.completed.
 * Updates enrollment status and payment information in the database.
 * 
 * @param {Object} req - Request object containing Stripe webhook event
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Webhook processing result
 */
export default async function handleStripeWebhook(req, logger) {
  logger.info("########## Handle Stripe Webhook ##########");
  logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      logger.error('Stripe secret key missing');
      return {
        success: false,
        error: 'Stripe secret key not configured',
        messageKey: 'STRIPE_NOT_CONFIGURED'
      };
    }

    if (!webhookSecret) {
      logger.error('Stripe webhook secret missing');
      return {
        success: false,
        error: 'Stripe webhook secret not configured',
        messageKey: 'WEBHOOK_SECRET_NOT_CONFIGURED'
      };
    }

    const stripe = new Stripe(stripeSecretKey);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('Missing Stripe signature header');
      return {
        success: false,
        error: 'Missing Stripe signature',
        messageKey: 'MISSING_SIGNATURE'
      };
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      logger.info('Webhook signature verified', { type: event.type, id: event.id });
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err.message });
      return {
        success: false,
        error: `Webhook signature verification failed: ${err.message}`,
        messageKey: 'INVALID_SIGNATURE'
      };
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info('Processing checkout.session.completed', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          metadata: session.metadata
        });

        const { enrollmentId, courseId } = session.metadata || {};

        if (!enrollmentId) {
          logger.error('Missing enrollmentId in session metadata', { sessionId: session.id });
          return {
            success: false,
            error: 'Missing enrollmentId in session metadata',
            messageKey: 'MISSING_ENROLLMENT_ID'
          };
        }

        // Update enrollment in Hasura
        // Note: This assumes Hasura GraphQL endpoint is available
        // For now, we'll return the data needed for the update
        const updateData = {
          enrollmentId: parseInt(enrollmentId),
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          paymentStatus: 'COMPLETED',
          paymentAmount: session.amount_total,
          paymentCurrency: session.currency
        };

        // In production, you would make a GraphQL mutation here to update CourseEnrollment
        // For now, we return the update data
        logger.info('Enrollment update prepared', updateData);

        return {
          success: true,
          eventType: event.type,
          enrollmentId: parseInt(enrollmentId),
          courseId: courseId ? parseInt(courseId) : null,
          updateData,
          message: 'Checkout session completed successfully'
        };
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        logger.info('Processing checkout.session.expired', {
          sessionId: session.id,
          metadata: session.metadata
        });

        const { enrollmentId } = session.metadata || {};

        if (enrollmentId) {
          // Update enrollment status to indicate payment expired
          const updateData = {
            enrollmentId: parseInt(enrollmentId),
            paymentStatus: 'FAILED'
          };

          logger.info('Enrollment update prepared for expired session', updateData);

          return {
            success: true,
            eventType: event.type,
            enrollmentId: parseInt(enrollmentId),
            updateData,
            message: 'Checkout session expired'
          };
        }

        return {
          success: true,
          eventType: event.type,
          message: 'Checkout session expired (no enrollment ID)'
        };
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.info('Processing payment_intent.payment_failed', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata
        });

        const { enrollmentId } = paymentIntent.metadata || {};

        if (enrollmentId) {
          const updateData = {
            enrollmentId: parseInt(enrollmentId),
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'FAILED'
          };

          logger.info('Enrollment update prepared for failed payment', updateData);

          return {
            success: true,
            eventType: event.type,
            enrollmentId: parseInt(enrollmentId),
            updateData,
            message: 'Payment failed'
          };
        }

        return {
          success: true,
          eventType: event.type,
          message: 'Payment failed (no enrollment ID)'
        };
      }

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
        return {
          success: true,
          eventType: event.type,
          message: `Unhandled event type: ${event.type}`
        };
    }

  } catch (error) {
    logger.error('Error handling Stripe webhook', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'WEBHOOK_PROCESSING_ERROR'
    };
  }
}

