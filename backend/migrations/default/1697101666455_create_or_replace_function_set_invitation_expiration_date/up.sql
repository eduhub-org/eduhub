CREATE OR REPLACE FUNCTION "public"."set_invitation_expiration_date"()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'INVITED' AND NEW."invitationExpirationDate" IS NULL) OR
     (TG_OP = 'UPDATE' AND NEW.status = 'INVITED' AND NEW."invitationExpirationDate" IS NULL) THEN
    NEW."invitationExpirationDate" = NOW() + interval '2 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
