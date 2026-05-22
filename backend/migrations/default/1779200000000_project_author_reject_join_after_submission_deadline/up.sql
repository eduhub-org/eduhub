-- Reject student join requests (ProjectAuthor.participationStatus = REQUESTED) once the
-- effective submission deadline has passed for every course linked to the project.
-- Effective deadline per course link: project.submissionDeadline, else course.projectSubmissionDeadline,
-- else program.defaultProjectSubmissionDeadline, else program.achievementRecordUploadDeadline.

CREATE OR REPLACE FUNCTION public.reject_project_author_join_after_submission_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."participationStatus" IS DISTINCT FROM 'REQUESTED' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "ProjectCourses" pc
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
        OR COALESCE(
          p."submissionDeadline",
          c."projectSubmissionDeadline",
          pr."defaultProjectSubmissionDeadline",
          pr."achievementRecordUploadDeadline"
        ) >= NOW()
      )
  ) THEN
    RAISE EXCEPTION 'project_submission_deadline_passed'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "project_author_before_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

CREATE TRIGGER "project_author_before_insert_reject_join_after_deadline"
BEFORE INSERT ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.reject_project_author_join_after_submission_deadline();

COMMENT ON FUNCTION public.reject_project_author_join_after_submission_deadline()
  IS 'Blocks ProjectAuthor join requests (REQUESTED) when no linked course still has an open effective submission deadline.';
