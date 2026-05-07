CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
     AND NEW."submittedAt" IS NULL
  THEN
    NEW."submittedAt" = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "set_project_submitted_metadata_trigger" ON "public"."Project";
CREATE TRIGGER "set_project_submitted_metadata_trigger"
BEFORE UPDATE ON "public"."Project"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_project_submitted_metadata"();

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Auto-stamps Project.submittedAt = now() when status transitions to SUBMITTED. submittedBy is set separately via a Hasura permission preset because triggers cannot read Hasura session variables.';
