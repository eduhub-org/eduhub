CREATE TRIGGER "set_public_EnrollmentStatus_updated_at"
BEFORE UPDATE ON "public"."EnrollmentStatus"
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();COMMENT ON TRIGGER "set_public_EnrollmentStatus_updated_at" ON "public"."EnrollmentStatus"
IS E'trigger to set value of column "updated_at" to current timestamp on row update';
