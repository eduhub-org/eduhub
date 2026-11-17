-- Feature flag for the embedded course chat (Matrix). Off by default, so the
-- chat stays hidden until an admin turns it on under Settings → Course chat.
ALTER TABLE "public"."AppSettings"
  ADD COLUMN "matrixChatEnabled" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."AppSettings"."matrixChatEnabled" IS E'Whether course pages show the embedded Matrix course chat to participants and instructors.';
