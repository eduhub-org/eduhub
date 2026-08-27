-- Reverting requires that no address is held by both a guest record and a real
-- account; anonymize any such guest record first or this will fail.
DROP INDEX "public"."User_email_non_guest_key";

ALTER TABLE "public"."User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
