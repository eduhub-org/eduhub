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
