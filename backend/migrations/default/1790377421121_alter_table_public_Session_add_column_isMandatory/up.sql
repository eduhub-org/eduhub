-- Optional sessions: participation is still tracked, but optional sessions do
-- not count toward the course's maxMissedSessions or appear on certificates.
ALTER TABLE "public"."Session"
ADD COLUMN "isMandatory" boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN "public"."Session"."isMandatory" IS 'If false, attendance is tracked but does not count toward passing (maxMissedSessions) or certificates';
