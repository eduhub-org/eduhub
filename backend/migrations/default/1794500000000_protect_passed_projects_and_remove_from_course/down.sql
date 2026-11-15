DROP FUNCTION IF EXISTS public.project_courses(public."Project");
DROP TRIGGER IF EXISTS delete_project_when_no_course_remains ON public."ProjectCourse";
DROP FUNCTION IF EXISTS public.delete_project_when_no_course_remains();
DROP TRIGGER IF EXISTS prevent_deleting_passed_project ON public."Project";
DROP FUNCTION IF EXISTS public.prevent_deleting_passed_project();
