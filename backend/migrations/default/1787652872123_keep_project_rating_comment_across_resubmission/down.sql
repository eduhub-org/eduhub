-- Restore the function from 1787077535591, which clears "ratingComment" when a
-- project re-enters SUBMITTED.
CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    NEW."submittedAt" = now();
    NEW."ratingComment" = NULL;
    NEW."rating" = 'UNRATED';
    NEW."sentBackAt" = NULL;
  ELSIF OLD."status" = 'SUBMITTED'
        AND (NEW."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    NEW."submittedAt" = NULL;
    NEW."submittedBy" = NULL;
    IF NEW."status" = 'ONGOING' THEN
      NEW."sentBackAt" = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN "public"."Project"."ratingComment" IS
  'Optional comment from course staff or project mentor accompanying rating (UNRATED/PASSED/FAILED).';

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Maintains submission and review-round metadata on Project. Entering SUBMITTED stamps submittedAt (overwriting any client value), resets rating/ratingComment so each review round starts clean, and clears sentBackAt. Leaving SUBMITTED clears submittedAt/submittedBy, and stamps sentBackAt when the new status is ONGOING (a send-back). submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';
