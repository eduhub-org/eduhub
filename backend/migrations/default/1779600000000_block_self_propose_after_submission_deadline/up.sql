-- Also block self-proposed projects (ACCEPTED author row on a new PROPOSED project)
-- after the effective course submission deadline, matching join-request behaviour.

CREATE OR REPLACE FUNCTION public.reject_project_author_join_after_submission_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."participationStatus" = 'ACCEPTED' THEN
    -- Self-propose: proposer becomes the first ACCEPTED author on a new PROPOSED project.
    IF NOT EXISTS (
      SELECT 1
      FROM "Project" p
      WHERE p.id = NEW."projectId"
        AND p.status = 'PROPOSED'
        AND p."proposedByUserId" = NEW."userId"
    ) THEN
      RETURN NEW;
    END IF;
  ELSIF NEW."participationStatus" IS DISTINCT FROM 'REQUESTED' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "ProjectCourse" pc
    INNER JOIN "Course" c ON c.id = pc."courseId"
    INNER JOIN "Project" p ON p.id = pc."projectId"
    LEFT JOIN "Program" pr ON pr.id = c."programId"
    WHERE pc."projectId" = NEW."projectId"
      AND (
        COALESCE(
          p."submissionDeadline",
          c."projectSubmissionDeadline",
          pr."defaultProjectSubmissionDeadline",
          pr."achievementRecordUploadDeadline"
        ) IS NULL
        OR (
          COALESCE(
            p."submissionDeadline",
            c."projectSubmissionDeadline",
            pr."defaultProjectSubmissionDeadline",
            pr."achievementRecordUploadDeadline"
          )::date >= CURRENT_DATE
        )
      )
  ) THEN
    RAISE EXCEPTION 'project_submission_deadline_passed'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.reject_project_author_join_after_submission_deadline()
  IS 'Blocks ProjectAuthor REQUESTED join requests and ACCEPTED self-propose rows when no linked course still has an open effective submission deadline (inclusive calendar date).';
