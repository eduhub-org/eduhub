-- Insert the default platform organization with explicit id = 0
INSERT INTO "public"."Organization" ("id", "name", "type", "description")
VALUES (0, 'EduHub Default', 'NON_PROFIT_ORGANIZATION',
        'Default platform organization. Cannot be deleted.');

-- Trigger to prevent deletion of the default organization
CREATE OR REPLACE FUNCTION prevent_default_organization_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id = 0 THEN
    RAISE EXCEPTION 'Cannot delete the default platform organization (id = 0)';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_default_organization
BEFORE DELETE ON "public"."Organization"
FOR EACH ROW
EXECUTE FUNCTION prevent_default_organization_deletion();
