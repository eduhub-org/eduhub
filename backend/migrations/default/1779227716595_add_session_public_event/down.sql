-- Reverse: drop the isPublicEvent flag from Session.

ALTER TABLE "public"."Session"
    DROP COLUMN IF EXISTS "isPublicEvent";
