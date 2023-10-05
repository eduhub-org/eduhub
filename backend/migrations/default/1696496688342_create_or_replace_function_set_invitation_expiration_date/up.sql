

CREATE OR REPLACE FUNCTION "public"."set_invitation_expiration_date"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."invitationExpirationDate" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_invitation_expiration_date_trigger"
BEFORE INSERT ON "public"."CourseEnrollment"
FOR EACH ROW 
EXECUTE PROCEDURE "public"."set_invitation_expiration_date"();
COMMENT ON TRIGGER "set_invitation_expiration_date_trigger" ON "public"."CourseEnrollment" 
IS 'trigger to set default value of column "invitationExpirationDate" to two days after creation on row insert';
