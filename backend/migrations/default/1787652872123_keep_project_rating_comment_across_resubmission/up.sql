-- Keep the previous review round's comment on resubmission.
--
-- 1787066497807 started clearing "ratingComment" when a project re-enters
-- SUBMITTED, to stop a stale send-back comment from being prefilled in
-- ReviewProjectDialog and mailed out as feedback on a passed project. That
-- fixed the leak but also threw the feedback away exactly when it is most
-- useful: while reviewing the revision, the course team can no longer see what
-- they asked for last round, and the team no longer sees it either.
--
-- Keep the comment instead, and solve the original leak where it belongs: the
-- dialog now shows a stored comment as read-only context of the previous round
-- and starts its input empty while the project is SUBMITTED, so a verdict only
-- ever mails text the reviewer typed for that verdict. The comment lives on
-- until the next verdict overwrites it (UpdateProjectReviewVerdict always
-- writes "ratingComment" together with "status" and "rating").
--
-- "rating" is still reset: a resubmitted project genuinely carries no verdict,
-- and the status chips key off it. So while status = SUBMITTED, rating is
-- always UNRATED and any non-null "ratingComment" is the previous round's.
CREATE OR REPLACE FUNCTION "public"."set_project_submitted_metadata"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'SUBMITTED'
     AND (OLD."status" IS DISTINCT FROM 'SUBMITTED')
  THEN
    -- Always stamp server-side; never trust a client-supplied submittedAt.
    NEW."submittedAt" = now();
    -- The new round starts unrated, but keeps the previous round's comment as
    -- context until the next verdict replaces it.
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

COMMENT ON COLUMN "public"."Project"."ratingComment" IS
  E'Optional instructor comment accompanying the project rating. Survives resubmission so the previous review round''s feedback stays visible while the revision is reviewed; replaced by the next verdict (UpdateProjectReviewVerdict writes status, rating and ratingComment together). While status = SUBMITTED the rating is always UNRATED, so a non-null value there belongs to the previous round.';

COMMENT ON TRIGGER "set_project_submitted_metadata_trigger" ON "public"."Project"
IS 'Maintains submission and review-round metadata on Project. Entering SUBMITTED stamps submittedAt (overwriting any client value), resets rating to UNRATED while keeping the previous round''s ratingComment as review context, and clears sentBackAt. Leaving SUBMITTED clears submittedAt/submittedBy, and stamps sentBackAt when the new status is ONGOING (a send-back). submittedBy on the way in is set via a Hasura permission preset because triggers cannot read Hasura session variables.';
