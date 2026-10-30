DROP TRIGGER IF EXISTS "normalize_Course_maxParticipants" ON "public"."Course";
DROP FUNCTION IF EXISTS "public"."normalize_Course_maxParticipants"();
COMMENT ON COLUMN "public"."Course"."maxParticipants" IS NULL;
