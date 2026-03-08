ALTER TABLE "public"."Organization"
  ADD COLUMN "newsletterProvider" text NOT NULL DEFAULT 'GHOST',
  ADD COLUMN "ghostNewsletterApiUrl" text NULL,
  ADD COLUMN "ghostNewsletterListId" text NULL,
  ADD COLUMN "ghostNewsletterSlug" text NULL,
  ADD COLUMN "ghostNewsletterLabel" text NULL,
  ADD COLUMN "ghostNewsletterDoubleOptInEnabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "public"."Organization"
  ADD CONSTRAINT "Organization_newsletterProvider_check"
  CHECK ("newsletterProvider" IN ('GHOST'));

ALTER TABLE "public"."Organization"
  ADD CONSTRAINT "Organization_ghostNewsletterConfig_check"
  CHECK (
    (
      ("ghostNewsletterApiUrl" IS NULL OR btrim("ghostNewsletterApiUrl") = '')
      AND ("ghostNewsletterListId" IS NULL OR btrim("ghostNewsletterListId") = '')
      AND ("ghostNewsletterSlug" IS NULL OR btrim("ghostNewsletterSlug") = '')
    )
    OR (
      ("ghostNewsletterApiUrl" IS NOT NULL AND btrim("ghostNewsletterApiUrl") <> '')
      AND (
        ("ghostNewsletterListId" IS NOT NULL AND btrim("ghostNewsletterListId") <> '')
        OR ("ghostNewsletterSlug" IS NOT NULL AND btrim("ghostNewsletterSlug") <> '')
      )
    )
  );

COMMENT ON COLUMN "public"."Organization"."newsletterProvider" IS E'Newsletter provider for this organization. Currently only GHOST is supported.';
COMMENT ON COLUMN "public"."Organization"."ghostNewsletterApiUrl" IS E'Ghost members API URL used to synchronize newsletter subscriptions.';
COMMENT ON COLUMN "public"."Organization"."ghostNewsletterListId" IS E'Optional Ghost newsletter list identifier.';
COMMENT ON COLUMN "public"."Organization"."ghostNewsletterSlug" IS E'Optional Ghost newsletter slug when list ID is not used.';
COMMENT ON COLUMN "public"."Organization"."ghostNewsletterLabel" IS E'Optional custom newsletter label shown in participant-facing UIs.';
COMMENT ON COLUMN "public"."Organization"."ghostNewsletterDoubleOptInEnabled" IS E'Whether Ghost double opt-in should be used for this organization newsletter.';

CREATE TABLE "public"."OrganizationNewsletterSubscription" (
  "userId" uuid NOT NULL,
  "organizationId" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'UNSUBSCRIBED',
  "externalSubscriberId" text NULL,
  "lastSyncedAt" timestamptz NULL,
  "source" text NOT NULL DEFAULT 'PROFILE',
  "errorMessage" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "organizationId"),
  CONSTRAINT "OrganizationNewsletterSubscription_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "public"."User" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT "OrganizationNewsletterSubscription_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "public"."Organization" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT "OrganizationNewsletterSubscription_status_check"
    CHECK ("status" IN ('SUBSCRIBED', 'UNSUBSCRIBED', 'PENDING', 'ERROR')),
  CONSTRAINT "OrganizationNewsletterSubscription_source_check"
    CHECK ("source" IN ('CHECKBOX', 'PROFILE', 'WEBHOOK', 'ADMIN'))
);

CREATE INDEX "OrganizationNewsletterSubscription_organizationId_idx"
  ON "public"."OrganizationNewsletterSubscription" ("organizationId");

COMMENT ON TABLE "public"."OrganizationNewsletterSubscription" IS E'Tracks newsletter subscription state per user and organization, including synchronization metadata with external providers.';
COMMENT ON COLUMN "public"."OrganizationNewsletterSubscription"."status" IS E'Current subscription state in local database and synchronization pipeline.';
COMMENT ON COLUMN "public"."OrganizationNewsletterSubscription"."externalSubscriberId" IS E'Identifier of the subscriber in the external provider (e.g., Ghost member id).';
COMMENT ON COLUMN "public"."OrganizationNewsletterSubscription"."source" IS E'Origin of the latest subscription state change.';
COMMENT ON COLUMN "public"."OrganizationNewsletterSubscription"."errorMessage" IS E'Last synchronization error message.';

CREATE TRIGGER "set_public_OrganizationNewsletterSubscription_updated_at"
BEFORE UPDATE ON "public"."OrganizationNewsletterSubscription"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_OrganizationNewsletterSubscription_updated_at" ON "public"."OrganizationNewsletterSubscription"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
