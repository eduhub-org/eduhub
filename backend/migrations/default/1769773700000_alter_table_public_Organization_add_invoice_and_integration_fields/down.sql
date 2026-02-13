-- Remove Formbricks integration fields
ALTER TABLE "public"."Organization"
DROP COLUMN IF EXISTS "formbricksApiKey",
DROP COLUMN IF EXISTS "formbricksApiUrl";

-- Remove Stripe integration fields
ALTER TABLE "public"."Organization"
DROP COLUMN IF EXISTS "stripeSecretKey",
DROP COLUMN IF EXISTS "stripeWebhookSecret",
DROP COLUMN IF EXISTS "stripePublishableKey";

-- Remove invoicing default fields
ALTER TABLE "public"."Organization"
DROP COLUMN IF EXISTS "invoiceFooterText",
DROP COLUMN IF EXISTS "invoiceNumberPrefix",
DROP COLUMN IF EXISTS "defaultVatRate",
DROP COLUMN IF EXISTS "defaultTaxExemptionNote";

-- Remove bank details
ALTER TABLE "public"."Organization"
DROP COLUMN IF EXISTS "bankName",
DROP COLUMN IF EXISTS "bankIban",
DROP COLUMN IF EXISTS "bankBic";

-- Drop country foreign key constraint before dropping the column
ALTER TABLE "public"."Organization"
DROP CONSTRAINT IF EXISTS "Organization_country_fkey";

-- Remove invoice and contact fields
ALTER TABLE "public"."Organization"
DROP COLUMN IF EXISTS "addressLine1",
DROP COLUMN IF EXISTS "addressLine2",
DROP COLUMN IF EXISTS "postalCode",
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "country",
DROP COLUMN IF EXISTS "legalName",
DROP COLUMN IF EXISTS "legalForm",
DROP COLUMN IF EXISTS "taxNumber",
DROP COLUMN IF EXISTS "vatId",
DROP COLUMN IF EXISTS "managingDirector",
DROP COLUMN IF EXISTS "registerCourt",
DROP COLUMN IF EXISTS "registerNumber",
DROP COLUMN IF EXISTS "email",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "website";
