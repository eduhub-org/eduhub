-- Adds "pastSessions" so the application history can tell "the sessions are over,
-- but no attendance was recorded" (common for events) from "still upcoming".
--
-- The view now has a row for every enrollment with at least one mandatory past
-- session, not only for enrollments with attendance rows. attendedSessions and
-- totalSessions keep their meaning: per (user, session) the effective attendance
-- is the INSTRUCTOR row if there is one, otherwise the row with the highest id;
-- NO_INFO and sessions without any row are not counted.
CREATE OR REPLACE VIEW "public"."CourseEnrollmentAttendanceStats" AS
SELECT
  enrollment.id AS "enrollmentId",
  COUNT(*) FILTER (WHERE effective.status = 'ATTENDED')::int AS "attendedSessions",
  COUNT(*) FILTER (WHERE effective.status IN ('ATTENDED', 'MISSED'))::int AS "totalSessions",
  COUNT(*)::int AS "pastSessions"
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
LEFT JOIN LATERAL (
  SELECT attendance.status
  FROM "public"."Attendance" attendance
  WHERE attendance."sessionId" = session_row.id
    AND attendance."userId" = enrollment."userId"
  ORDER BY
    (attendance.source IS NOT DISTINCT FROM 'INSTRUCTOR') DESC,
    attendance.id DESC
  LIMIT 1
) effective ON true
WHERE NOT enrollment."isTest"
GROUP BY enrollment.id;

COMMENT ON VIEW "public"."CourseEnrollmentAttendanceStats" IS
  'Per course enrollment: mandatory past sessions (pastSessions, including program sessions), and of those the attended and counted (attended + missed) ones. Instructor-recorded attendance wins over automated sources. pastSessions > 0 with totalSessions = 0 means no attendance was recorded. Test enrollments are excluded.';
