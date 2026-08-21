-- A resubmission starts a fresh review round, so the previous round's verdict
-- must not linger on the row. It used to: ReviewProjectDialog seeds its comment
-- box from Project."ratingComment", so a send-back comment was still prefilled
-- when the instructor later approved the resubmitted project — and since the
-- review mails carry [Project:ReviewComment], a stale revision request could be
-- mailed out as feedback on a passed project.
--
-- Clearing happens here rather than in the client mutation because user_access
-- may update "status" but not "ratingComment"/"rating", and because this covers
-- every path into SUBMITTED, not just the one the frontend uses.
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
IS 'Stamps Project.submittedAt = now() and resets rating/ratingComment when status transitions into SUBMITTED (overwrites any client value, so each review round starts without the previous round''s verdict) and clears submittedAt/submittedBy when status transitions out of SUBMITTED. submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';
