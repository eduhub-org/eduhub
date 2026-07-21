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
    $status: InvoiceStatus_enum!
    $netTotal: Int!
    $vatTotal: Int!
    $grossTotal: Int!
    $currency: String!
    $stripeCheckoutSessionId: String
    $stripePaymentIntentId: String
    $stripeInvoiceId: String
    $stripeHostedInvoiceUrl: String
    $stripeInvoicePdfUrl: String
  ) {
    insert_Invoice_one(
      object: {
        organizationId: $organizationId
        userId: $userId
        courseEnrollmentId: $courseEnrollmentId
        invoiceNumber: $invoiceNumber
        status: $status
        netTotal: $netTotal
        vatTotal: $vatTotal
        grossTotal: $grossTotal
        currency: $currency
        stripeCheckoutSessionId: $stripeCheckoutSessionId
        stripePaymentIntentId: $stripePaymentIntentId
        stripeInvoiceId: $stripeInvoiceId
        stripeHostedInvoiceUrl: $stripeHostedInvoiceUrl
        stripeInvoicePdfUrl: $stripeInvoicePdfUrl
      }
    ) {
      id
    }
  }
`;

const UPDATE_INVOICE_STATUS_BY_SESSION = gql`
  mutation UpdateInvoiceStatusBySession($sessionId: String!, $status: InvoiceStatus_enum!) {
    update_Invoice(
      where: { stripeCheckoutSessionId: { _eq: $sessionId } }
      _set: { status: $status }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_ENROLLMENT_STATUS_ABORTED = gql`
  mutation UpdateEnrollmentStatusAborted($enrollmentId: Int!) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { status: ABORTED }
    ) {
      id
      status
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

  /**
   * Resolves the Stripe-generated invoice document (invoice_creation) so
   * the Invoice row carries the legally required document references.
   */
  const resolveStripeInvoice = async (
    invoiceRef: string | Stripe.Invoice | null | undefined
  ): Promise<{ id: string | null; hostedUrl: string | null; pdfUrl: string | null }> => {
    if (!invoiceRef) {
      return { id: null, hostedUrl: null, pdfUrl: null };
    }
    try {
      const invoice =
        typeof invoiceRef === 'string'
          ? await stripe.invoices.retrieve(invoiceRef)
          : invoiceRef;
      return {
        id: invoice.id ?? null,
        hostedUrl: invoice.hosted_invoice_url ?? null,
        pdfUrl: invoice.invoice_pdf ?? null,
      };
    } catch (err) {
      console.warn('Could not resolve Stripe invoice document:', err);
      return {
        id: typeof invoiceRef === 'string' ? invoiceRef : null,
        hostedUrl: null,
        pdfUrl: null,
      };
    }
  };

  const createInvoiceForEnrollment = async (
    enrollmentId: number,
    session: {
      amountTotal: number;
      amountTax: number | null;
      currency: string;
      stripeCheckoutSessionId: string | null;
      stripePaymentIntentId: string | null;
      stripeInvoice?: string | Stripe.Invoice | null;
    },
    status: 'PAID' | 'ISSUED' | 'CANCELLED'
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

    // Course prices are gross (inclusive tax rate): amount_total is the
    // gross total, total_details.amount_tax the contained VAT portion.
    const grossTotal = session.amountTotal;
    const vatTotal = session.amountTax ?? 0;
    const netTotal = grossTotal - vatTotal;

    const invoiceNumber = generateInvoiceNumber(
      invoiceNumberPrefix,
      session.stripeCheckoutSessionId,
      session.stripePaymentIntentId
    );

    const stripeInvoice = await resolveStripeInvoice(session.stripeInvoice);

    await client.request(INSERT_INVOICE, {
      organizationId,
      userId,
      courseEnrollmentId: enrollmentId,
      invoiceNumber,
      status,
      netTotal,
      vatTotal,
      grossTotal,
      currency: (session.currency || 'eur').toUpperCase(),
      stripeCheckoutSessionId: session.stripeCheckoutSessionId,
      stripePaymentIntentId: session.stripePaymentIntentId,
      stripeInvoiceId: stripeInvoice.id,
      stripeHostedInvoiceUrl: stripeInvoice.hostedUrl,
      stripeInvoicePdfUrl: stripeInvoice.pdfUrl,
    });
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId, courseId } = session.metadata || {};

        // StuJo job posting checkout (metadata set by publishJobPosting)
        const jobPostingId = parseJobPostingId(session.metadata?.jobPostingId);
        if (jobPostingId !== null) {
          await handleJobPostingCheckoutCompleted(client, stripe, session, jobPostingId);
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
              {
                amountTotal: session.amount_total ?? 0,
                amountTax: session.total_details?.amount_tax ?? null,
                currency: session.currency ?? 'eur',
                stripeCheckoutSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null,
                stripeInvoice: session.invoice as string | Stripe.Invoice | null,
              },
              // SEPA / bank transfer settle later: ISSUED until
              // async_payment_succeeded flips the invoice to PAID.
              session.payment_status === 'paid' ? 'PAID' : 'ISSUED'
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
          return res.status(200).json({ received: true });
        }
        // Course enrollment: delayed payment settled, invoice ISSUED -> PAID
        if (session.metadata?.enrollmentId) {
          await client.request(UPDATE_INVOICE_STATUS_BY_SESSION, {
            sessionId: session.id,
            status: 'PAID',
          });
        }
        return res.status(200).json({ received: true });
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const failedJobPostingId = parseJobPostingId(session.metadata?.jobPostingId);
        if (failedJobPostingId !== null) {
          await handleJobPostingAsyncPaymentFailed(client, session, failedJobPostingId);
          return res.status(200).json({ received: true });
        }
        // Course enrollment: delayed payment failed after the enrollment
        // was optimistically confirmed — revert to ABORTED and cancel the
        // invoice reference.
        if (session.metadata?.enrollmentId) {
          const parsedId = parseAndValidateEnrollmentId(session.metadata.enrollmentId);
          if (parsedId !== null) {
            await client.request(UPDATE_ENROLLMENT_STATUS_ABORTED, { enrollmentId: parsedId });
            await client.request(UPDATE_INVOICE_STATUS_BY_SESSION, {
              sessionId: session.id,
              status: 'CANCELLED',
            });
          }
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
              {
                amountTotal: session.amount_total ?? 0,
                amountTax: session.total_details?.amount_tax ?? null,
                currency: session.currency ?? 'eur',
                stripeCheckoutSessionId: session.id,
                stripePaymentIntentId: null,
              },
              'CANCELLED'
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
              {
                amountTotal: paymentIntent.amount ?? 0,
                amountTax: null,
                currency: paymentIntent.currency ?? 'eur',
                stripeCheckoutSessionId: null,
                stripePaymentIntentId: paymentIntent.id,
              },
              'CANCELLED'
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
