-- Single-use double opt-in tokens for account-less event registration.
--
-- A guest's *registration* is pending until the emailed link is used, so this
-- table holds that pending state: which course, whether the optional marketing
-- checkbox was ticked, and when the link stops working. Once redeemed the row
-- is spent and the CourseEnrollment exists instead.
--
-- Only the SHA-256 hash is stored, so a database read yields no working links.
--
-- The *manage* link that later appears in every mail to a guest is deliberately
-- not stored here: it is a stateless HMAC over the user id (see
-- functions/callNodeFunction/guestRegistration.js), which lets any mailer
-- regenerate it without the platform ever holding a replayable credential.
CREATE TABLE "public"."GuestRegistrationToken" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" text NOT NULL,
  "userId" uuid NOT NULL,
  "courseId" integer NOT NULL,
  "newsletterOptIn" boolean NOT NULL DEFAULT false,
  "expiresAt" timestamptz NOT NULL,
  "usedAt" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "GuestRegistrationToken_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "GuestRegistrationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."User" ("id")
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "GuestRegistrationToken_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "public"."Course" ("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Rate limiting counts recent tokens per user.
CREATE INDEX "GuestRegistrationToken_userId_created_at_idx"
  ON "public"."GuestRegistrationToken" ("userId", "created_at");

-- The abandoned-signup sweep in the anonymize_guest_data cron job scans by expiry.
CREATE INDEX "GuestRegistrationToken_expiresAt_idx"
  ON "public"."GuestRegistrationToken" ("expiresAt");

COMMENT ON TABLE "public"."GuestRegistrationToken" IS E'Hashed single-use double opt-in tokens for guest event registration. Written only by the guest registration cloud functions; no Hasura role has permissions on it.';
COMMENT ON COLUMN "public"."GuestRegistrationToken"."tokenHash" IS E'SHA-256 hex digest of the raw token. The raw token is only ever present in the emailed link.';
COMMENT ON COLUMN "public"."GuestRegistrationToken"."newsletterOptIn" IS E'Whether the guest ticked the optional future-events checkbox. Held here rather than acted on immediately, so marketing consent is only recorded once the address is confirmed.';
COMMENT ON COLUMN "public"."GuestRegistrationToken"."usedAt" IS E'Set when the token is redeemed. A spent token is rejected on any further use.';

CREATE TRIGGER "set_public_GuestRegistrationToken_updated_at"
BEFORE UPDATE ON "public"."GuestRegistrationToken"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_GuestRegistrationToken_updated_at" ON "public"."GuestRegistrationToken"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
