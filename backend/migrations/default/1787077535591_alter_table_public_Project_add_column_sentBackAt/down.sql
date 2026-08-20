-- Restore the function from 1787066497807 (no sentBackAt handling) before
-- dropping the column it references.
CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    NEW."submittedAt" = now();
    NEW."ratingComment" = NULL;
    NEW."rating" = 'UNRATED';
  ELSIF OLD."status" = 'SUBMITTED'
        AND (NEW."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    NEW."submittedAt" = NULL;
    NEW."submittedBy" = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Stamps Project.submittedAt = now() and resets rating/ratingComment when status transitions into SUBMITTED (overwrites any client value, so each review round starts without the previous round''s verdict) and clears submittedAt/submittedBy when status transitions out of SUBMITTED. submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';

ALTER TABLE "public"."Project" DROP COLUMN IF EXISTS "sentBackAt";
