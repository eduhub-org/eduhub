ALTER TABLE "public"."Attendance" ALTER COLUMN "attendanceRecordIndexes" TYPE integer
    USING "attendanceRecordIndexes"[1];

ALTER TABLE "public"."Attendance" RENAME COLUMN "attendanceRecordIndexes" TO "attendanceRecordIndex";

COMMENT ON COLUMN "public"."Attendance"."attendanceRecordIndex" IS
E'Key of the matched Attendance Record in Session.attendanceData (the pandas row index). NULL when nothing was matched. Each Attendance Record is matched to at most one Attendance.';
