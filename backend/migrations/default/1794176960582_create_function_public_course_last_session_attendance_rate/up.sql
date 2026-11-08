-- Share of a course's participants who attended its latest checked session (the session whose
-- attendance was checked most recently by start time), for sorting the course list. Mirrors
-- summarizeSessionAttendances in the frontend: only CONFIRMED, REGISTERED and COMPLETED
-- non-test enrollments count, a manual Attendance (source INSTRUCTOR) wins over the automatic one,
-- and participants without an Attendance count as not attended. NULL without a checked session or
-- without participants.
CREATE OR REPLACE FUNCTION "public"."course_last_session_attendance_rate"(course_row "public"."Course")
RETURNS numeric
LANGUAGE sql
STABLE
AS $function$
  WITH last_session AS (
    SELECT id
    FROM "public"."Session"
    WHERE "courseId" = course_row.id
      AND "attendanceData" IS NOT NULL
    ORDER BY "startDateTime" DESC
    LIMIT 1
  ),
  participant AS (
    SELECT DISTINCT "userId"
    FROM "public"."CourseEnrollment"
    WHERE "courseId" = course_row.id
      AND NOT "isTest"
      AND status IN ('CONFIRMED', 'REGISTERED', 'COMPLETED')
  ),
  effective_attendance AS (
    SELECT DISTINCT ON (attendance."userId") attendance."userId", attendance.status
    FROM "public"."Attendance" attendance
    JOIN last_session ON last_session.id = attendance."sessionId"
    JOIN participant ON participant."userId" = attendance."userId"
    ORDER BY attendance."userId", (attendance.source = 'INSTRUCTOR') DESC, attendance.id DESC
  )
  SELECT
    (SELECT COUNT(*) FROM effective_attendance WHERE status = 'ATTENDED')::numeric
      / NULLIF((SELECT COUNT(*) FROM participant), 0)
  WHERE EXISTS (SELECT 1 FROM last_session);
$function$;
