-- The data cleanup/grouping is not reverted: the single-course series it removed
-- carried no information, and the series it created are valid data.
DROP TRIGGER IF EXISTS "check_Course_courseSeriesId_organization" ON "public"."Course";
DROP TRIGGER IF EXISTS "assign_Course_courseSeriesId_on_publish" ON "public"."Course";
DROP FUNCTION IF EXISTS "public"."check_course_series_organization"();
DROP FUNCTION IF EXISTS "public"."assign_course_series_on_publish"();
DROP FUNCTION IF EXISTS "public"."resolve_course_series"(integer, text, integer);
DROP FUNCTION IF EXISTS "public"."course_title_is_placeholder"(text);
