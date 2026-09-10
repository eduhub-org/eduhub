ALTER TABLE "public"."JobPosting" ADD COLUMN "termsAcceptedAt" timestamptz NULL;

COMMENT ON COLUMN "public"."JobPosting"."termsAcceptedAt" IS 'When the employer accepted the terms at the point of purchase. Server-controlled: written by the publishJobPosting action only, never by the client, because a forgeable or backdatable timestamp would not evidence anything. Which version of the terms was accepted is recovered from the git history of the terms page, as described in docs/LEGAL_DOCUMENTS.md.';
