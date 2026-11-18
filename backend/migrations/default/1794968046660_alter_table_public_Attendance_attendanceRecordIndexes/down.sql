-- A single index cannot hold a combined Attendance: refuse instead of
-- silently dropping the extra Attendance Records.
LOCK TABLE "public"."Attendance" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "public"."Attendance" WHERE cardinality("attendanceRecordIndexes") > 1) THEN
        RAISE EXCEPTION 'Attendances combine several Attendance Records; re-check those sessions with the old matcher before rolling back';
    END IF;
END $$;

ALTER TABLE "public"."Attendance" ALTER COLUMN "attendanceRecordIndexes" TYPE integer
    USING "attendanceRecordIndexes"[1];

ALTER TABLE "public"."Attendance" RENAME COLUMN "attendanceRecordIndexes" TO "attendanceRecordIndex";

COMMENT ON COLUMN "public"."Attendance"."attendanceRecordIndex" IS
E'Key of the matched Attendance Record in Session.attendanceData (the pandas row index). NULL when nothing was matched. Each Attendance Record is matched to at most one Attendance.';
