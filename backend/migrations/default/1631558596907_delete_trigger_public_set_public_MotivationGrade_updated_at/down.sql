CREATE TRIGGER "set_public_MotivationGrade_updated_at"
BEFORE UPDATE ON "public"."MotivationRating"
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();COMMENT ON TRIGGER "set_public_MotivationGrade_updated_at" ON "public"."MotivationRating"
IS E'trigger to set value of column "updated_at" to current timestamp on row update';
