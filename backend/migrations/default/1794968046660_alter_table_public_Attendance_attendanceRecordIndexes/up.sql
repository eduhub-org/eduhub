-- One Attendance can combine several Zoom records of the same person (renamed for
-- breakout rooms, phone dial-in), so it points to a list of Attendance Records.
-- Renamed in place (not dropped) so Hasura carries the permissions over.

ALTER TABLE "public"."Attendance" RENAME COLUMN "attendanceRecordIndex" TO "attendanceRecordIndexes";

ALTER TABLE "public"."Attendance" ALTER COLUMN "attendanceRecordIndexes" TYPE integer[]
    USING CASE WHEN "attendanceRecordIndexes" IS NULL THEN NULL ELSE ARRAY["attendanceRecordIndexes"] END;

COMMENT ON COLUMN "public"."Attendance"."attendanceRecordIndexes" IS
E'Keys of the matched Attendance Records in Session.attendanceData (the pandas row indexes), in join order. Several when one person left several Zoom records that were combined. NULL when nothing was matched. Each Attendance Record is matched to at most one Attendance.';
