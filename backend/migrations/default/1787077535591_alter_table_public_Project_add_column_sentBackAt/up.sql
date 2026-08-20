-- MyProjectPanel gates its "sent back for revision" banner on
--   status = ONGOING AND submittedAt IS NOT NULL
-- which can never hold: a send-back is exactly SUBMITTED -> ONGOING, and the
-- ELSIF branch below nulls submittedAt in that same statement. The banner has
-- therefore never rendered, leaving authors with a neutral "ONGOING" chip and
-- no indication that their project came back from review.
--
-- Record the send-back explicitly instead, with a column that survives the
-- transition it describes.
ALTER TABLE "public"."Project" ADD COLUMN "sentBackAt" timestamptz NULL;

COMMENT ON COLUMN "public"."Project"."sentBackAt" IS
  E'When the project was last sent back for revision (SUBMITTED -> ONGOING). Cleared on resubmission, so a non-null value means the project is currently awaiting a revision. Not backfillable: earlier send-backs left no trace once submittedAt was cleared.';

CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    -- Always stamp server-side; never trust a client-supplied submittedAt.
    NEW."submittedAt" = now();
    -- A new review round starts clean.
    NEW."ratingComment" = NULL;
    NEW."rating" = 'UNRATED';
    -- Resubmitting closes the open send-back.
    NEW."sentBackAt" = NULL;
  ELSIF OLD."status" = 'SUBMITTED'
        AND (NEW."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    -- Clear submission attribution when leaving the SUBMITTED state (e.g. send-back).
    NEW."submittedAt" = NULL;
    NEW."submittedBy" = NULL;
    -- Only a return to ONGOING is a send-back; COMPLETED and INCOMPLETE are
    -- final verdicts and must not set sentBackAt.
    IF NEW."status" = 'ONGOING' THEN
      NEW."sentBackAt" = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Maintains submission and review-round metadata on Project. Entering SUBMITTED stamps submittedAt (overwriting any client value), resets rating/ratingComment so each review round starts clean, and clears sentBackAt. Leaving SUBMITTED clears submittedAt/submittedBy, and stamps sentBackAt when the new status is ONGOING (a send-back). submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';
