-- Restore the function body from 1778500000010, without the review-state reset.
CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    -- Always stamp server-side; never trust a client-supplied submittedAt.
    NEW."submittedAt" = now();
  ELSIF OLD."status" = 'SUBMITTED'
        AND (NEW."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    -- Clear submission attribution when leaving the SUBMITTED state (e.g. send-back).
    NEW."submittedAt" = NULL;
    NEW."submittedBy" = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Stamps Project.submittedAt = now() when status transitions into SUBMITTED (overwrites any client value) and clears submittedAt/submittedBy when status transitions out of SUBMITTED. submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';
