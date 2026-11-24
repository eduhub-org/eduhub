DROP TRIGGER IF EXISTS published_course_keeps_an_instructor ON "public"."CourseInstructor";
DROP FUNCTION IF EXISTS public.published_course_keeps_an_instructor();

DROP TRIGGER IF EXISTS course_publish_requires_instructor ON "public"."Course";
DROP FUNCTION IF EXISTS public.course_publish_requires_instructor();
