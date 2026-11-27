-- Position of a project's Project Status (CONTEXT.md) in the project
-- lifecycle, so the Admin projects overview can page through all projects
-- sorted by status on the server. Project Status is derived from several
-- columns and the Project Team, so Hasura can't order by it directly; it is
-- exposed as the scalar computed field Project.projectStatusRank.
--
-- Keep in sync with the status chip logic in
-- frontend-nx/apps/edu-hub/components/pages/CourseContent/Projects/projectStatusDisplay.ts
-- (isOpenTemplate, resolveProjectStatusChipKey):
--   0 Project Template           PROPOSED, no ACCEPTED author (published or not)
--   1 Awaiting Confirmation      PROPOSED with an ACCEPTED author
--   2 Ongoing                    ONGOING, not sent back
--   3 Sent Back                  ONGOING with sentBackAt set
--   4 Submitted                  SUBMITTED
--   5 Passed                     COMPLETED, not suggested for publication
--   6 Suggested for Publication  COMPLETED, suggested, not published
--   7 Published                  published (or the deprecated PUBLISHED status)
--   8 Not Passed                 INCOMPLETE
--   9 anything else
CREATE OR REPLACE FUNCTION public.project_status_rank(project_row public."Project")
RETURNS integer
LANGUAGE sql
STABLE
AS $function$
  SELECT CASE
    WHEN project_row.status = 'PROPOSED'
      AND NOT EXISTS (
        SELECT 1
        FROM public."ProjectAuthor" pa
        WHERE pa."projectId" = project_row.id
          AND pa."participationStatus" = 'ACCEPTED'
      ) THEN 0
    WHEN project_row.published OR project_row.status = 'PUBLISHED' THEN 7
    WHEN project_row.status = 'PROPOSED' THEN 1
    WHEN project_row.status = 'ONGOING' AND project_row."sentBackAt" IS NULL THEN 2
    WHEN project_row.status = 'ONGOING' THEN 3
    WHEN project_row.status = 'SUBMITTED' THEN 4
    WHEN project_row.status = 'COMPLETED' AND project_row."suggestedForPublication" THEN 6
    WHEN project_row.status = 'COMPLETED' THEN 5
    WHEN project_row.status = 'INCOMPLETE' THEN 8
    ELSE 9
  END
$function$;

COMMENT ON FUNCTION public.project_status_rank(public."Project") IS
  'Lifecycle position (0 Project Template ... 8 Not Passed) of the derived Project Status. Computed field Project.projectStatusRank; sorts the projects overview.';
