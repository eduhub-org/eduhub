-- Guest registration is opt-in per event: it opens the only unauthenticated write
-- path in the application, so it must never be active unless an organizer asks for it.
ALTER TABLE "public"."Course"
  ADD COLUMN "guestRegistrationEnabled" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Course"."guestRegistrationEnabled" IS E'Whether visitors without an account may register for this course/event with just name and email. Only honoured for courses in a Program of type EVENTS with a direct registration type.';
