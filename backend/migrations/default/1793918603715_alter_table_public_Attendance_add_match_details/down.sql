COMMENT ON COLUMN "public"."Attendance"."matchType" IS
E'How the Attendance row was matched to the enrolled user. Allowed values: EMAIL (exact, case-insensitive email match against the source), NAME (fuzzy display-name match with score >= 80), NONE (no sufficient match — status will be MISSED; recordedIdentifier, if present, is the closest candidate). NULL for legacy rows created before this column existed.';

ALTER TABLE "public"."Attendance"
    DROP COLUMN IF EXISTS "closestCandidates",
    DROP COLUMN IF EXISTS "attendanceRecordIndex",
    DROP COLUMN IF EXISTS "matchScore";
