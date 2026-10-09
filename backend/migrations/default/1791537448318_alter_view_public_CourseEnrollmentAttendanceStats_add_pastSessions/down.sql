-- Restores the view without "pastSessions" (only enrollments with attendance rows).
DROP VIEW IF EXISTS "public"."CourseEnrollmentAttendanceStats";

CREATE OR REPLACE VIEW "public"."CourseEnrollmentAttendanceStats" AS
WITH effective_attendance AS (
  SELECT DISTINCT ON (enrollment.id, session_row.id)
    enrollment.id AS "enrollmentId",
    attendance.status
  FROM "public"."CourseEnrollment" enrollment
  JOIN "public"."Course" course_row
    ON course_row.id = enrollment."courseId"
  JOIN "public"."Session" session_row
    ON (
      session_row."courseId" = enrollment."courseId"
      OR (session_row."programId" IS NOT NULL AND session_row."programId" = course_row."programId")
    )
    AND session_row."isMandatory"
    AND session_row."endDateTime" < now()
  JOIN "public"."Attendance" attendance
    ON attendance."sessionId" = session_row.id
    AND attendance."userId" = enrollment."userId"
  WHERE NOT enrollment."isTest"
  ORDER BY
    enrollment.id,
    session_row.id,
    (attendance.source IS NOT DISTINCT FROM 'INSTRUCTOR') DESC,
    attendance.id DESC
)
SELECT
  "enrollmentId",
  COUNT(*) FILTER (WHERE status = 'ATTENDED')::int AS "attendedSessions",
  COUNT(*) FILTER (WHERE status IN ('ATTENDED', 'MISSED'))::int AS "totalSessions"
FROM effective_attendance
GROUP BY "enrollmentId";

COMMENT ON VIEW "public"."CourseEnrollmentAttendanceStats" IS
  'Attended and counted (attended + missed) mandatory past sessions per course enrollment, including program sessions. Instructor-recorded attendance wins over automated sources. Test enrollments are excluded.';
