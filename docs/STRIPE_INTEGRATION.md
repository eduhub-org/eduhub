# Stripe Integration Documentation

## Overview

EduHub integrates with [Stripe](https://stripe.com) to handle course enrollment payments. The integration supports course base pricing and add-on pricing based on Formbricks survey responses, providing a seamless payment experience for users.

## Key Features

- **Checkout Sessions**: Secure Stripe Checkout sessions for course enrollment payments
- **Add-on Pricing**: Dynamic pricing based on Formbricks survey responses
- **Webhook Processing**: Automatic enrollment status updates when payments complete
- **Payment Tracking**: Full payment history and status tracking in the database
- **Multi-environment Support**: Separate configurations for development, staging, and production

## Architecture

### Components

#### 1. **Backend Functions** (`functions/callNodeFunction/`)

**`createStripeCheckout/index.js`**
- Creates Stripe Checkout sessions for course enrollments
- Handles base course pricing and selected add-ons
- Returns checkout URL for redirect

**`createStripeAddonPrices/index.js`**
- Creates Stripe products and prices for validated add-ons
- Manages product/price lifecycle

#### 2. **Frontend Components**

**`pages/api/webhooks/stripe.ts`**
- Next.js API route for receiving Stripe webhooks
- Verifies webhook signatures
- Updates enrollment records via GraphQL mutations

**`components/pages/CourseContent/Registration/hooks/useRegistrationHandler.ts`**
- Handles registration flow including Stripe checkout
- Creates checkout session via GraphQL mutation
- Redirects user to Stripe Checkout

### Database Schema

**`CourseEnrollment` table:**
- `stripeCheckoutSessionId`: Stripe Checkout Session ID
- `stripePaymentIntentId`: Stripe Payment Intent ID
- `paymentStatus`: Enum (`PENDING`, `COMPLETED`, `FAILED`)
- `paymentAmount`: Payment amount in cents
- `paymentCurrency`: Currency code (e.g., `eur`, `usd`)

**`Course` table:**
- `basePrice`: Base course price in cents
- `currency`: Currency code
- `stripeProductId`: Stripe Product ID
- `stripePriceId`: Stripe Price ID

**`CourseAddonMapping` table:**
- `validatedPrice`: Add-on price in cents
- `stripeProductId`: Stripe Product ID
- `stripePriceId`: Stripe Price ID

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy your **Secret Key** (starts with `sk_test_...` for test mode)
4. Copy your **Publishable Key** (starts with `pk_test_...` for test mode)

### 2. Environment Configuration

#### Development Environment

1. **Install Stripe CLI** (for local webhook testing):
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Download from https://stripe.com/docs/stripe-cli
   ```

2. **Authenticate Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Start local webhook listener**:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
   This will output a webhook signing secret (starts with `whsec_...`). You can use this temporarily, but it's recommended to leave `STRIPE_WEBHOOK_SECRET` empty in development and use the CLI instead.

4. **Configure `.env` file**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_test_secret_key
   STRIPE_WEBHOOK_SECRET=  # Leave empty, use Stripe CLI instead
   STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
   ```

#### Staging Environment

**Note:** Staging and production environments use Terraform for configuration, not `.env` files.

1. **Create Webhook Endpoint in Stripe Sandbox**:
   - Go to Stripe Dashboard → **Developers → Webhooks**
   - Click **"+ Add endpoint"** or **"+ Ziel hinzufügen"**
   - Enter your staging webhook URL: `https://staging.your-domain.com/api/webhooks/stripe`
   - Select events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `payment_intent.payment_failed`
     - `invoice.finalized`
   - Click **Add endpoint**

   > **`invoice.finalized` is required for StuJo job postings.** Their
   > confirmation mail carries the invoice PDF, and Stripe finalizes
   > `invoice_creation` invoices asynchronously, so the PDF often does not exist
   > yet at `checkout.session.completed`. Without this event the mail falls
   > through to the `send_pending_job_posting_mails` cron sweep and arrives up to
   > ~30 minutes late. Nothing fails loudly if you forget it, so check it here.

2. **Get Webhook Signing Secret**:
   - Click on your newly created webhook endpoint
   - Copy the **Signing secret** (starts with `whsec_...`)

3. **Configure via Terraform**:
   - Update Terraform variables with your Stripe test keys and webhook secret
   - Secrets are stored in Google Secret Manager (see `infrastructure/application/01_secrets.tf`)
   - Cloud functions automatically load secrets from Secret Manager (see `infrastructure/application/06_cloud-functions.tf`)
   - Frontend environment variables are set via Terraform (see `infrastructure/application/07_edu.tf`)

#### Production Environment

**Note:** Production uses Terraform for configuration, not `.env` files.

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create Webhook Endpoint**:
   - Go to Stripe Dashboard → **Developers → Webhooks**
   - Click **"+ Add endpoint"**
   - Enter your production webhook URL: `https://your-domain.com/api/webhooks/stripe`
   - Select the same events as staging:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `payment_intent.payment_failed`
     - `invoice.finalized`
   - Click **Add endpoint**

3. **Get Live Webhook Signing Secret**:
   - Copy the signing secret from your live webhook endpoint

4. **Configure via Terraform**:
   - Update Terraform variables with your Stripe live keys (`sk_live_...`, `pk_live_...`) and webhook secret
   - Secrets are stored in Google Secret Manager
   - Apply Terraform changes to update the infrastructure

### 3. Docker Compose Configuration (Local Development Only)

The `docker-compose.yml` file automatically loads Stripe environment variables from your `.env` file for local development:

```yaml
frontend-nx:
  environment:
    STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
    STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY:-}

node_functions:
  environment:
    STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
    STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
```

**Note:** This configuration is only for local development. Staging and production environments use Terraform (see below).

### 4. Terraform Configuration (Staging & Production)

Stripe secrets for staging and production are configured via Terraform:

- **Secret definitions**: `infrastructure/application/01_secrets.tf`
  - Defines Google Secret Manager secrets for `stripe_secret_key` and `stripe_webhook_secret`
  - Secrets are populated from Terraform variables
  
- **Cloud function configuration**: `infrastructure/application/06_cloud-functions.tf`
  - Injects Stripe secrets into the `call_node_function` cloud function
  - Secrets are loaded from Secret Manager at runtime
  
- **Frontend configuration**: `infrastructure/application/07_edu.tf`
  - Sets `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as an environment variable for the frontend service

To configure Stripe for staging/production:
1. Set Terraform variables for Stripe keys and webhook secrets
2. Apply Terraform changes: `terraform apply`
3. Secrets are automatically stored in Google Secret Manager
4. Services load secrets from Secret Manager at runtime

## Webhook Events

### Supported Events

1. **`checkout.session.completed`**
   - Triggered when a payment is successfully completed
   - Updates enrollment: `paymentStatus = COMPLETED`, `status = CONFIRMED`
   - Stores payment details (amount, currency, session ID, payment intent ID)

2. **`checkout.session.expired`**
   - Triggered when a checkout session expires without payment
   - Updates enrollment: `paymentStatus = FAILED`

3. **`checkout.session.async_payment_succeeded`**
   - Delayed payment method (SEPA direct debit) settled
   - Course: enrollment confirmed. Job posting: invoice `ISSUED` -> `PAID`

4. **`checkout.session.async_payment_failed`**
   - Delayed payment failed after the fact
   - Job posting: taken offline (`DRAFT`), invoice `CANCELLED`, employer notified

5. **`payment_intent.payment_failed`**
   - Triggered when a payment attempt fails
   - Updates enrollment: `paymentStatus = FAILED`

6. **`invoice.finalized`**
   - Stripe has assigned the invoice its document number and rendered the PDF
   - Backfills `Invoice.stripeInvoiceNumber` / `stripeInvoicePdfUrl` /
     `stripeHostedInvoiceUrl`
   - For job postings, releases the confirmation mail with the PDF attached if
     it was not already sent at checkout time. Handled by
     `handleJobPostingInvoiceFinalized` in `lib/stripeJobPosting.ts`; the
     `send_pending_job_posting_mails` cron is the backstop when this event never
     arrives.

### Webhook Security

All webhook requests are verified using Stripe's signature verification:

```typescript
event = stripe.webhooks.constructEvent(
  rawBody,
  stripeSignature,
  webhookSecret
);
```

This ensures that webhook events are authentic and come from Stripe.

## Payment Flow

### 1. User Registration Flow

1. User fills out course registration form (including Formbricks survey)
2. User selects add-ons (if applicable)
3. Frontend calls `createStripeCheckout` mutation
4. Backend creates Stripe Checkout session with:
   - Base course price (if applicable)
   - Selected add-on prices
   - Metadata: `courseId`, `enrollmentId`, `formbricksResponseId`
5. User is redirected to Stripe Checkout
6. User completes payment
7. Stripe sends `checkout.session.completed` webhook
8. Webhook handler updates enrollment status

### 2. Payment Status Updates

- **Pending**: Enrollment created, payment not yet completed
- **Completed**: Payment successful, enrollment confirmed
- **Failed**: Payment failed or expired

## Testing

### Local Testing with Stripe CLI

1. **Start Stripe CLI listener**:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

2. **Trigger test events**:
   ```bash
   # Simulate successful payment
   stripe trigger checkout.session.completed
   
   # Simulate expired session
   stripe trigger checkout.session.expired
   
   # Simulate failed payment
   stripe trigger payment_intent.payment_failed
   ```

3. **View webhook logs**:
   ```bash
   stripe logs tail
   ```

### Test Cards

Use Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

See [Stripe Testing Documentation](https://stripe.com/docs/testing) for more test cards.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook endpoint URL** is correct and publicly accessible
2. **Verify webhook secret** matches the one in Stripe Dashboard
3. **Check webhook logs** in Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Logs
4. **For local development**: Ensure Stripe CLI is running and forwarding correctly

### Payment Status Not Updating

1. **Check webhook handler logs** for errors
2. **Verify enrollment ID** is present in checkout session metadata
3. **Check GraphQL mutation** is executing successfully
4. **Verify Hasura permissions** allow enrollment updates

### Stripe CLI Connection Issues

1. **Re-authenticate**: `stripe login`
2. **Check Stripe CLI version**: `stripe --version`
3. **Restart listener**: Stop and restart `stripe listen`

## Security Considerations

1. **Never commit secrets**: 
   - Local development: Stripe keys are in `.env` (gitignored)
   - Staging/Production: Stripe keys are stored in Google Secret Manager via Terraform
2. **Use test keys for development**: Never use live keys in development or staging
3. **Webhook signature verification**: Always verify webhook signatures to ensure events are from Stripe
4. **HTTPS required**: Production webhooks must use HTTPS (enforced by Stripe)
5. **Secret rotation**: Rotate webhook secrets if compromised
6. **Environment separation**: Use separate Stripe accounts or test/live modes for different environments

## Related Documentation

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Formbricks Integration](./FORMBRICKS_INTEGRATION.md) - For add-on pricing based on survey responses

## Environment Variables Reference

### Local Development (`.env` file)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key (test mode) | Yes | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | No* | `whsec_...` |
| `STRIPE_PUBLISHABLE_KEY` | Frontend publishable key (test mode) | Yes | `pk_test_...` |

\* Not required for local development when using Stripe CLI

### Staging & Production (Terraform/Secret Manager)

Stripe configuration for staging and production is managed via Terraform:
- Secrets are stored in Google Secret Manager
- Configured in `infrastructure/application/01_secrets.tf`
- Injected into services via `infrastructure/application/06_cloud-functions.tf` and `07_edu.tf`
- Use Terraform variables to set values, not `.env` files
