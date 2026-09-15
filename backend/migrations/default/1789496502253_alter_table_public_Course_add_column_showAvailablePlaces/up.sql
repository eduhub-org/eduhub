ALTER TABLE "public"."Course"
  ADD COLUMN "showAvailablePlaces" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Course"."showAvailablePlaces" IS
  E'When true the course page states how many of the maxParticipants places are still free. Off by default: the page otherwise shows only how many people are taking part, which says the course is alive without advertising how empty it is.';
