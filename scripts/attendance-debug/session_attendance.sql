-- Read-only queries for investigating one participant's attendance.
-- Paste each block into Hasura Console -> Data -> SQL ("Track this" off).
-- Adjust the course id, date and name pattern in each block.
-- Session.attendanceData is a pandas DataFrame.to_json(): column -> {rowIndex -> value},
-- timestamps as epoch milliseconds (UTC), duration in seconds.

-- 1) Sessions of the course: times in UTC and Berlin, length, how many records
SELECT s.id, s.title,
       s."startDateTime" AT TIME ZONE 'Europe/Berlin' AS start_berlin,
       s."endDateTime"   AT TIME ZONE 'Europe/Berlin' AS end_berlin,
       s."startDateTime" AT TIME ZONE 'UTC'           AS start_utc,
       round(extract(epoch FROM s."endDateTime" - s."startDateTime") / 60) AS session_min,
       round(extract(epoch FROM s."endDateTime" - s."startDateTime") / 120) AS min_needed_50pct,
       (SELECT count(*) FROM jsonb_object_keys(s."attendanceData"::jsonb -> 'name')) AS records
FROM "Session" s
WHERE s."courseId" = 691
ORDER BY s."startDateTime";

-- 2) The participant's Attendance rows in every session of the course
--    (status, how matched, duration, interruptions, and whether it was edited by hand)
SELECT s."startDateTime" AT TIME ZONE 'Europe/Berlin' AS session_start,
       a.id, a.status, a.source, a."matchType", a."matchScore",
       a."attendanceRecordIndexes", a."recordedIdentifier",
       a."startDateTime" AT TIME ZONE 'Europe/Berlin' AS join_berlin,
       a."endDateTime"   AT TIME ZONE 'Europe/Berlin' AS leave_berlin,
       round(a."totalAttendanceTime" / 60.0, 1) AS minutes,
       round(100.0 * a."totalAttendanceTime" / extract(epoch FROM s."endDateTime" - s."startDateTime")) AS pct,
       a."interruptionCount", a."closestCandidates",
       a.created_at, a.updated_at
FROM "Attendance" a
JOIN "Session" s ON s.id = a."sessionId"
JOIN "User" u ON u.id = a."userId"
WHERE s."courseId" = 691
  AND (u."firstName" || ' ' || u."lastName") ILIKE '%<last name>%'
ORDER BY s."startDateTime", a.created_at;

-- 3) All Attendance Records of the session, unpacked, with who claimed each one.
--    Look for a second record of the same person (other device / name variant /
--    guest rejoin): it stays unclaimed, because a participant takes at most ONE
--    Zoom record, so its minutes are not added.
WITH s AS (
  SELECT id, "startDateTime", "endDateTime", "attendanceData"::jsonb AS d
  FROM "Session"
  WHERE "courseId" = 691
    AND ("startDateTime" AT TIME ZONE 'Europe/Berlin')::date = '2026-11-10'
), r AS (
  SELECT s.id AS session_id, k::int AS idx,
         s.d -> 'name'   ->> k AS name,
         s.d -> 'email'  ->> k AS email,
         s.d -> 'source' ->> k AS source,
         to_timestamp((s.d -> 'joinDateTime'  ->> k)::bigint / 1000.0) AS join_at,
         to_timestamp((s.d -> 'leaveDateTime' ->> k)::bigint / 1000.0) AS leave_at,
         (s.d -> 'duration' ->> k)::numeric AS duration_s,
         (s.d -> 'interruptionCount' ->> k)::int AS interruptions,
         extract(epoch FROM s."endDateTime" - s."startDateTime") AS session_s
  FROM s, jsonb_object_keys(s.d -> 'name') AS k
)
SELECT r.idx, r.name, r.email, r.source,
       r.join_at  AT TIME ZONE 'Europe/Berlin' AS join_berlin,
       r.leave_at AT TIME ZONE 'Europe/Berlin' AS leave_berlin,
       round(r.duration_s / 60, 1) AS minutes,
       round(100 * r.duration_s / r.session_s) AS pct,
       r.interruptions,
       u."firstName" || ' ' || u."lastName" AS claimed_by, a.status, a."matchType"
FROM r
LEFT JOIN "Attendance" a ON a."sessionId" = r.session_id AND r.idx = ANY(a."attendanceRecordIndexes")
LEFT JOIN "User" u ON u.id = a."userId"
-- Narrow down if the list is long; keep unclaimed rows to spot device names:
-- WHERE r.name ~* '<first>|<last>' OR r.email ~* '<last>' OR a.id IS NULL
ORDER BY r.join_at;

-- 4) Course-wide health check: everyone matched online but MISSED for being
--    below the Minimum Attendance Time. Many such rows in one session (all
--    joining late / leaving early together) point at a Zoom instance that was
--    dropped by the session-window filter rather than at individual absences.
SELECT s."startDateTime" AT TIME ZONE 'Europe/Berlin' AS session_start,
       count(*) FILTER (WHERE a.source = 'ZOOM' AND a.status = 'MISSED' AND a."matchType" <> 'NONE') AS zoom_below_min,
       count(*) FILTER (WHERE a.source = 'ZOOM' AND a.status = 'ATTENDED') AS zoom_attended,
       min(a."startDateTime") FILTER (WHERE a.source = 'ZOOM') AT TIME ZONE 'Europe/Berlin' AS earliest_join,
       max(a."endDateTime") FILTER (WHERE a.source = 'ZOOM') AT TIME ZONE 'Europe/Berlin' AS latest_leave
FROM "Session" s
LEFT JOIN "Attendance" a ON a."sessionId" = s.id
WHERE s."courseId" = 691
GROUP BY s.id
ORDER BY s."startDateTime";
