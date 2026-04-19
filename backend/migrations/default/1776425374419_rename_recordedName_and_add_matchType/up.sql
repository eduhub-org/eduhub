-- Rename Attendance.recordedName to Attendance.recordedIdentifier and add Attendance.matchType.
-- Rationale: the column previously held only the Zoom display name. After the Zoom
-- attendance rework (occurrence-based aggregation with email-first matching) it now
-- holds whichever identifier was used for (or closest to) the match — email when
-- available, otherwise display name. A separate `matchType` column records how the
-- match was performed so analytics can distinguish high-confidence email matches
-- from fuzzy name matches and unmatched rows.

ALTER TABLE "public"."Attendance"
    RENAME COLUMN "recordedName" TO "recordedIdentifier";

COMMENT ON COLUMN "public"."Attendance"."recordedIdentifier" IS
E'Identifier from the external attendance source (Zoom, LimeSurvey, ...) that was used for — or was the closest candidate to — matching this Attendance row to the enrolled user. Contains the email when the source provided one, otherwise the recorded display name. NULL only when there was no attendance data at all for the session.';

ALTER TABLE "public"."Attendance"
    ADD COLUMN "matchType" text NULL;

COMMENT ON COLUMN "public"."Attendance"."matchType" IS
E'How the Attendance row was matched to the enrolled user. Allowed values: EMAIL (exact, case-insensitive email match against the source), NAME (fuzzy display-name match with score >= 80), NONE (no sufficient match — status will be MISSED; recordedIdentifier, if present, is the closest candidate). NULL for legacy rows created before this column existed.';
