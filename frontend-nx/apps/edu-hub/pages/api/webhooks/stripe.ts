import type { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import Stripe from 'stripe';
import getRawBody from 'raw-body';

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const UPDATE_ENROLLMENT_PAYMENT = gql`
  mutation UpdateEnrollmentPayment(
    $enrollmentId: Int!
    $stripeCheckoutSessionId: String
    $stripePaymentIntentId: String
    $paymentStatus: PaymentStatus_enum!
    $paymentAmount: Int
    $paymentCurrency: String
  ) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: {
        stripeCheckoutSessionId: $stripeCheckoutSessionId
        stripePaymentIntentId: $stripePaymentIntentId
        paymentStatus: $paymentStatus
        paymentAmount: $paymentAmount
        paymentCurrency: $paymentCurrency
        status: CONFIRMED
      }
    ) {
      id
      paymentStatus
      status
    }
  }
`;

const INSERT_ENROLLMENT_ADDON = gql`
  mutation InsertEnrollmentAddon(
    $enrollmentId: Int!
    $addonMappingId: Int!
    $priceAtPurchase: Int!
    $currency: String!
  ) {
    insert_EnrollmentAddon_one(
      object: {
        enrollmentId: $enrollmentId
        addonMappingId: $addonMappingId
        priceAtPurchase: $priceAtPurchase
        currency: $currency
      }
    ) {
      id
    }
  }
`;

const handleStripeWebhook = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe configuration missing');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;
  if (!hasuraAdminSecret || hasuraAdminSecret.trim() === '') {
    console.error('HASURA_ADMIN_SECRET is missing or empty');
    return res.status(500).json({ error: 'Hasura configuration missing' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event: Stripe.Event;

  try {
    // Get raw body for signature verification
    // When bodyParser is false, we need to read from the request stream
    const rawBody = await getRawBody(req as any, {
      limit: '10mb',
      encoding: 'utf8',
    });
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Create GraphQL client
  const client = new GraphQLClient(
    process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql',
    {
      headers: {
        'x-hasura-admin-secret': hasuraAdminSecret,
      },
    }
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId, courseId, selectedAddons } = session.metadata || {};

        if (!enrollmentId) {
          console.error('Missing enrollmentId in session metadata');
          return res.status(400).json({ error: 'Missing enrollmentId' });
        }

        const parsedEnrollmentId = Number.parseInt(enrollmentId, 10);

        // Update enrollment with payment information
        await client.request(UPDATE_ENROLLMENT_PAYMENT, {
          enrollmentId: parsedEnrollmentId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || null,
          paymentStatus: 'COMPLETED',
          paymentAmount: session.amount_total || null,
          paymentCurrency: session.currency || null,
        });

        // Parse and save selected add-ons
        if (selectedAddons && selectedAddons.trim() !== '') {
          try {
            const addons = JSON.parse(selectedAddons);
            const currency = (session.currency || 'EUR').toUpperCase();

            for (const addon of addons) {
              if (addon.id && addon.price !== undefined) {
                await client.request(INSERT_ENROLLMENT_ADDON, {
                  enrollmentId: parsedEnrollmentId,
                  addonMappingId: addon.id,
                  priceAtPurchase: addon.price,
                  currency: currency,
                });
              }
            }

            console.log('Enrollment add-ons saved successfully', {
              enrollmentId,
              addonCount: addons.length,
            });
          } catch (error: any) {
            console.error('Error parsing or saving add-ons:', error.message);
            // Don't fail the webhook if add-on saving fails - payment is already recorded
          }
        }

        console.log('Enrollment updated successfully', {
          enrollmentId,
          courseId,
          sessionId: session.id,
        });

        return res.status(200).json({ received: true });
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId } = session.metadata || {};

        if (enrollmentId) {
          await client.request(UPDATE_ENROLLMENT_PAYMENT, {
            enrollmentId: Number.parseInt(enrollmentId, 10),
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: null,
            paymentStatus: 'FAILED',
            paymentAmount: null,
            paymentCurrency: null,
          });
        }

        return res.status(200).json({ received: true });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { enrollmentId } = paymentIntent.metadata || {};

        if (enrollmentId) {
          await client.request(UPDATE_ENROLLMENT_PAYMENT, {
            enrollmentId: Number.parseInt(enrollmentId, 10),
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'FAILED',
            paymentAmount: paymentIntent.amount || null,
            paymentCurrency: paymentIntent.currency || null,
          });
        }

        return res.status(200).json({ received: true });
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return res.status(200).json({ received: true });
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export default handleStripeWebhook;

