-- Attendance summary per course enrollment, for the application history shown
-- to instructors and admins. Only counts are exposed, never the Attendance rows.
--
-- Sessions counted: mandatory sessions (isMandatory) of the course and of its
-- program that have already ended. Per (user, session) the effective attendance
-- is the INSTRUCTOR row if there is one, otherwise the row with the highest id
-- (same rule as pickEffectiveAttendance / pick_effective_attendance).
-- NO_INFO is ignored, so totalSessions = attended + missed.
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

-- The view looks attendance up per applicant; Attendance had no index on userId.
CREATE INDEX IF NOT EXISTS "Attendance_userId_sessionId_idx"
  ON "public"."Attendance" ("userId", "sessionId");
