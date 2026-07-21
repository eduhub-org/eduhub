-- NOTE: restoring the two-value check fails while any CourseGroupOption row with
-- contentType = 'JOB' still exists. Remove or repoint those rows before running
-- this down migration.
ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT "CourseGroupOption_contentType_check";
ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_contentType_check"
  CHECK ("contentType" IN ('COURSE', 'PROJECT'));

COMMENT ON COLUMN "public"."CourseGroupOption"."contentType" IS E'Whether this slider row renders courses (COURSE, default) or projects (PROJECT). PROJECT rows compose their membership from the ProjectSliderCourseGroup / ProjectSliderProjectGroup selections.';
