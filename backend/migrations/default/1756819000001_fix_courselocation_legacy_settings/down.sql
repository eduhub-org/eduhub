-- Rollback CourseLocation legacy settings fix
-- This migration reverts the changes made in the up migration

-- 1. Revert the column default to use the original sequence
ALTER TABLE "public"."CourseLocation" ALTER COLUMN "id" SET DEFAULT nextval('public."CourseAddress_id_seq"');

-- 2. Drop the new sequence
DROP SEQUENCE IF EXISTS "public"."CourseLocation_id_seq";

-- 3. Revert the primary key constraint name
ALTER TABLE "public"."CourseLocation" RENAME CONSTRAINT "CourseLocation_pkey" TO "CourseAddress_pkey";

-- 4. Recreate the legacy trigger
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_public_CourseAddress_updated_at"
BEFORE UPDATE ON "public"."CourseLocation"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
