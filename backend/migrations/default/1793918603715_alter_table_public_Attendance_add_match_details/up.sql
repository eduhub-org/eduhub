-- Attendance match details for the attendance hover and the raw-data dialog.

ALTER TABLE "public"."Attendance"
    ADD COLUMN "matchScore" integer NULL,
    ADD COLUMN "attendanceRecordIndex" integer NULL,
    ADD COLUMN "closestCandidates" jsonb NULL;

COMMENT ON COLUMN "public"."Attendance"."matchScore" IS
E'Fuzzy name score (0-100) of the matched Attendance Record. NULL for EMAIL matches, for Manual Attendances and when nothing was matched.';

COMMENT ON COLUMN "public"."Attendance"."attendanceRecordIndex" IS
E'Key of the matched Attendance Record in Session.attendanceData (the pandas row index). NULL when nothing was matched. Each Attendance Record is matched to at most one Attendance.';

COMMENT ON COLUMN "public"."Attendance"."closestCandidates" IS
E'Only for unmatched (matchType NONE) Attendances: the best name candidate per Attendance Location, as [{"location": "ONLINE"|"KIEL"|..., "identifier": "<recorded name>", "score": 0-100}].';

COMMENT ON COLUMN "public"."Attendance"."matchType" IS
E'How the Attendance row was matched to the enrolled user. Allowed values: EMAIL (exact, case-insensitive email match against the source), NAME (fuzzy display-name match with score >= 80, also against the cleaned handle), PARTIAL_NAME (a single first name, email local part or initial + last name that fits exactly one participant), NONE (no sufficient match — status will be MISSED; closestCandidates holds the nearest names). A matched Attendance can still be MISSED when the online stay was below the Minimum Attendance Time. NULL for legacy rows and Manual Attendances.';
