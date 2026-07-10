import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import { GraphQLClient, gql } from 'graphql-request';
import Stripe from 'stripe';
import getRawBody from 'raw-body';

import {
  handleJobPostingCheckoutCompleted,
  handleJobPostingAsyncPaymentSucceeded,
  handleJobPostingAsyncPaymentFailed,
  handleJobPostingCheckoutExpired,
  parseJobPostingId,
} from '../../../lib/stripeJobPosting';

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const GET_ENROLLMENT_FOR_INVOICE = gql`
  query GetEnrollmentForInvoice($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      id
      userId
      Course {
        Program {
          organizationId
          Organization {
            invoiceNumberPrefix
          }
        }
      }
    }
  }
`;

type GetEnrollmentForInvoiceResponse = {
  CourseEnrollment_by_pk: {
    id: number;
    userId: string;
    Course: {
      Program: {
        organizationId: number | null;
        Organization: { invoiceNumberPrefix: string | null } | null;
      } | null;
    } | null;
  } | null;
};

type GetInvoiceByStripeSessionIdResponse = {
  Invoice: Array<{ id: number }>;
};

const GET_INVOICE_BY_STRIPE_SESSION_ID = gql`
  query GetInvoiceByStripeSessionId($stripeCheckoutSessionId: String!) {
    Invoice(where: { stripeCheckoutSessionId: { _eq: $stripeCheckoutSessionId } }, limit: 1) {
      id
    }
  }
`;

const UPDATE_ENROLLMENT_STATUS_CONFIRMED = gql`
  mutation UpdateEnrollmentStatusConfirmed($enrollmentId: Int!) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { status: CONFIRMED }
    ) {
      id
      status
    }
  }
`;

const INSERT_INVOICE = gql`
  mutation InsertInvoice(
    $organizationId: Int!
    $userId: uuid!
    $courseEnrollmentId: Int!
    $invoiceNumber: String!
    $netTotal: Int!
    $vatTotal: Int!
    $grossTotal: Int!
    $currency: String!
    $stripeCheckoutSessionId: String
    $stripePaymentIntentId: String
  ) {
    insert_Invoice_one(
      object: {
        organizationId: $organizationId
        userId: $userId
        courseEnrollmentId: $courseEnrollmentId
        invoiceNumber: $invoiceNumber
        status: PAID
        netTotal: $netTotal
        vatTotal: $vatTotal
        grossTotal: $grossTotal
        currency: $currency
        stripeCheckoutSessionId: $stripeCheckoutSessionId
        stripePaymentIntentId: $stripePaymentIntentId
        stripeHostedInvoiceUrl: null
      }
    ) {
      id
    }
  }
`;

const INSERT_INVOICE_CANCELLED = gql`
  mutation InsertInvoiceCancelled(
    $organizationId: Int!
    $userId: uuid!
    $courseEnrollmentId: Int!
    $invoiceNumber: String!
    $netTotal: Int!
    $vatTotal: Int!
    $grossTotal: Int!
    $currency: String!
    $stripeCheckoutSessionId: String
    $stripePaymentIntentId: String
  ) {
    insert_Invoice_one(
      object: {
        organizationId: $organizationId
        userId: $userId
        courseEnrollmentId: $courseEnrollmentId
        invoiceNumber: $invoiceNumber
        status: CANCELLED
        netTotal: $netTotal
        vatTotal: $vatTotal
        grossTotal: $grossTotal
        currency: $currency
        stripeCheckoutSessionId: $stripeCheckoutSessionId
        stripePaymentIntentId: $stripePaymentIntentId
      }
    ) {
      id
    }
  }
`;

/**
 * Parses and validates an enrollment ID from a string.
 * Returns null if the enrollment ID is invalid.
 */
function parseAndValidateEnrollmentId(enrollmentId: string): number | null {
  const parsed = Number.parseInt(enrollmentId, 10);

  if (
    Number.isNaN(parsed) ||
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

/**
 * Generates a unique invoice number for Stripe Checkout payments.
 * Uses session/payment intent ID as unique suffix when available.
 * Falls back to crypto.randomUUID() when both are absent to avoid collisions.
 */
function generateInvoiceNumber(
  prefix: string,
  sessionId?: string | null,
  paymentIntentId?: string | null
): string {
  const suffix = sessionId || paymentIntentId || `web-${randomUUID()}`;
  return `${prefix}-${suffix}`;
}

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

  const client = new GraphQLClient(
    process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql',
    {
      headers: {
        'x-hasura-admin-secret': hasuraAdminSecret,
      },
    }
  );

  const createInvoiceForEnrollment = async (
    enrollmentId: number,
    amountTotal: number,
    currency: string,
    status: 'PAID' | 'CANCELLED',
    stripeCheckoutSessionId: string | null,
    stripePaymentIntentId: string | null
  ) => {
    const { CourseEnrollment_by_pk } =
      await client.request<GetEnrollmentForInvoiceResponse>(
        GET_ENROLLMENT_FOR_INVOICE,
        { enrollmentId }
      );

    if (!CourseEnrollment_by_pk?.Course?.Program) {
      throw new Error(
        `Enrollment ${enrollmentId} not found or missing Course/Program`
      );
    }

    const program = CourseEnrollment_by_pk.Course.Program;
    const organizationId = program.organizationId;
    const userId = CourseEnrollment_by_pk.userId;

    if (organizationId == null) {
      throw new Error(
        `Enrollment ${enrollmentId} has no organization (Program.organizationId is null)`
      );
    }

    const invoiceNumberPrefix =
      program.Organization?.invoiceNumberPrefix ?? 'EDU';

    // For Stripe Checkout: amount_total is in cents, same as our schema.
    // Net/VAT split: use Stripe Tax breakdown when available; otherwise net = gross, vat = 0.
    const grossTotal = amountTotal;
    const netTotal = amountTotal; // Stripe Tax breakdown can be used when available
    const vatTotal = 0;

    const invoiceNumber = generateInvoiceNumber(
      invoiceNumberPrefix,
      stripeCheckoutSessionId,
      stripePaymentIntentId
    );

    if (status === 'PAID') {
      await client.request(INSERT_INVOICE, {
        organizationId,
        userId,
        courseEnrollmentId: enrollmentId,
        invoiceNumber,
        netTotal,
        vatTotal,
        grossTotal,
        currency: (currency || 'eur').toUpperCase(),
        stripeCheckoutSessionId,
        stripePaymentIntentId,
      });
    } else {
      await client.request(INSERT_INVOICE_CANCELLED, {
        organizationId,
        userId,
        courseEnrollmentId: enrollmentId,
        invoiceNumber,
        netTotal,
        vatTotal,
        grossTotal,
        currency: (currency || 'eur').toUpperCase(),
        stripeCheckoutSessionId,
        stripePaymentIntentId,
      });
    }
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId, courseId } = session.metadata || {};

        // StuJo job posting checkout (metadata set by publishJobPosting)
        const jobPostingId = parseJobPostingId(session.metadata?.jobPostingId);
        if (jobPostingId !== null) {
          await handleJobPostingCheckoutCompleted(client, session, jobPostingId);
          return res.status(200).json({ received: true });
        }

        if (!enrollmentId) {
          console.error('Missing enrollmentId in session metadata');
          return res.status(400).json({ error: 'Missing enrollmentId' });
        }

        const parsedEnrollmentId = parseAndValidateEnrollmentId(enrollmentId);
        if (parsedEnrollmentId === null) {
          console.error('Invalid enrollmentId in session metadata', {
            enrollmentId,
          });
          return res.status(400).json({ error: 'Invalid enrollmentId' });
        }

        try {
          await client.request(UPDATE_ENROLLMENT_STATUS_CONFIRMED, {
            enrollmentId: parsedEnrollmentId,
          });

          const { Invoice: existingInvoices } =
            await client.request<GetInvoiceByStripeSessionIdResponse>(
              GET_INVOICE_BY_STRIPE_SESSION_ID,
              { stripeCheckoutSessionId: session.id }
            );
          if (existingInvoices?.length === 0) {
            await createInvoiceForEnrollment(
              parsedEnrollmentId,
              session.amount_total ?? 0,
              session.currency ?? 'eur',
              'PAID',
              session.id,
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null
            );
          }
        } catch (err) {
          console.error('Error updating enrollment or creating invoice:', err);
          throw err;
        }

        console.log('Enrollment and invoice updated successfully', {
          enrollmentId,
          courseId,
          sessionId: session.id,
        });

        return res.status(200).json({ received: true });
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (parseJobPostingId(session.metadata?.jobPostingId) !== null) {
          await handleJobPostingAsyncPaymentSucceeded(client, session);
        }
        return res.status(200).json({ received: true });
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const failedJobPostingId = parseJobPostingId(session.metadata?.jobPostingId);
        if (failedJobPostingId !== null) {
          await handleJobPostingAsyncPaymentFailed(client, session, failedJobPostingId);
        }
        return res.status(200).json({ received: true });
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId } = session.metadata || {};

        // StuJo job posting: abandoned checkout goes back to DRAFT
        const expiredJobPostingId = parseJobPostingId(session.metadata?.jobPostingId);
        if (expiredJobPostingId !== null) {
          await handleJobPostingCheckoutExpired(client, expiredJobPostingId);
          return res.status(200).json({ received: true });
        }

        if (enrollmentId) {
          const parsedEnrollmentId = parseAndValidateEnrollmentId(enrollmentId);
          if (parsedEnrollmentId !== null) {
            await createInvoiceForEnrollment(
              parsedEnrollmentId,
              session.amount_total ?? 0,
              session.currency ?? 'eur',
              'CANCELLED',
              session.id,
              null
            );
          }
        }

        return res.status(200).json({ received: true });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { enrollmentId } = paymentIntent.metadata || {};

        if (enrollmentId) {
          const parsedEnrollmentId = parseAndValidateEnrollmentId(enrollmentId);
          if (parsedEnrollmentId !== null) {
            await createInvoiceForEnrollment(
              parsedEnrollmentId,
              paymentIntent.amount ?? 0,
              paymentIntent.currency ?? 'eur',
              'CANCELLED',
              null,
              paymentIntent.id
            );
          }
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
