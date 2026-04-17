-- Reverse: drop matchType and rename recordedIdentifier back to recordedName.

ALTER TABLE "public"."Attendance"
    DROP COLUMN IF EXISTS "matchType";

ALTER TABLE "public"."Attendance"
    RENAME COLUMN "recordedIdentifier" TO "recordedName";
