DROP TRIGGER IF EXISTS "sync_SessionAddress_to_public_event" ON "public"."SessionAddress";
DROP FUNCTION IF EXISTS "public"."sync_SessionAddress_to_public_event"();

DROP TRIGGER IF EXISTS "sync_Session_to_public_event" ON "public"."Session";
DROP FUNCTION IF EXISTS "public"."sync_Session_to_public_event"();

DROP TRIGGER IF EXISTS "init_Course_from_sourceSession" ON "public"."Course";
DROP FUNCTION IF EXISTS "public"."init_Course_from_sourceSession"();

DROP FUNCTION IF EXISTS "public"."sync_event_session_locations"(integer);
DROP FUNCTION IF EXISTS "public"."event_source_session_addresses"(integer);
DROP FUNCTION IF EXISTS "public"."sync_event_session_fields"(integer);

DROP TRIGGER IF EXISTS "check_Course_sourceSessionId" ON "public"."Course";
DROP FUNCTION IF EXISTS "public"."check_Course_sourceSessionId"();

ALTER TABLE "public"."Course" DROP CONSTRAINT IF EXISTS "Course_sourceSessionId_key";
ALTER TABLE "public"."Course" DROP CONSTRAINT IF EXISTS "Course_sourceSessionId_fkey";
ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "sourceSessionId";
