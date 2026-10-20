-- Attendance is collected per calendar day: all sessions starting on the same
-- day (in the app's timezone) count once toward maxMissedSessions. The columns
-- keep their names but now count days:
--   attendedSessions: mandatory past days with an attended session
--   totalSessions:    of those, the days with recorded attendance (attended or missed)
--   pastSessions:     mandatory past days
-- Per (user, session) the effective attendance is still the INSTRUCTOR row if
-- there is one, otherwise the row with the highest id. A day is attended if any
-- of its mandatory sessions was attended, else missed if any was missed. Keep in
-- sync with helpers/attendanceDays.ts and check_course_continuation.py.
CREATE OR REPLACE VIEW "public"."CourseEnrollmentAttendanceStats" AS
WITH app_time_zone AS (
  SELECT COALESCE(
    (SELECT NULLIF(settings."timeZone", '') FROM "public"."AppSettings" settings WHERE settings."appName" = 'edu'),
    'Europe/Berlin'
  ) AS name
),
session_attendance AS (
  SELECT
    enrollment.id AS "enrollmentId",
    (session_row."startDateTime" AT TIME ZONE app_time_zone.name)::date AS day,
    effective.status
  FROM "public"."CourseEnrollment" enrollment
  CROSS JOIN app_time_zone
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
),
day_attendance AS (
  SELECT
    "enrollmentId",
    CASE
      WHEN bool_or(status = 'ATTENDED') THEN 'ATTENDED'
      WHEN bool_or(status = 'MISSED') THEN 'MISSED'
    END AS status
  FROM session_attendance
  GROUP BY "enrollmentId", day
)
SELECT
  "enrollmentId",
  COUNT(*) FILTER (WHERE status = 'ATTENDED')::int AS "attendedSessions",
  COUNT(*) FILTER (WHERE status IN ('ATTENDED', 'MISSED'))::int AS "totalSessions",
  COUNT(*)::int AS "pastSessions"
FROM day_attendance
GROUP BY "enrollmentId";

COMMENT ON VIEW "public"."CourseEnrollmentAttendanceStats" IS
  'Per course enrollment, counted in days (sessions starting on the same day in the app timezone count once): mandatory past days (pastSessions, including program sessions), and of those the attended and counted (attended + missed) ones. A day is attended if any of its mandatory sessions was. Instructor-recorded attendance wins over automated sources. pastSessions > 0 with totalSessions = 0 means no attendance was recorded. Test enrollments are excluded.';
