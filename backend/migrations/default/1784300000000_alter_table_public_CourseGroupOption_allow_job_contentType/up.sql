-- Widen the contentType check to allow a third slider kind: JOB. A row with
-- contentType = 'JOB' is a job slider whose membership is composed from the job
-- posting types selected in the JobSliderJobType selection junction. Reusing
-- this table lets job sliders interleave by "order" with the course and project
-- sliders on the homepage.
ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT "CourseGroupOption_contentType_check";
ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_contentType_check"
  CHECK ("contentType" IN ('COURSE', 'PROJECT', 'JOB'));

COMMENT ON COLUMN "public"."CourseGroupOption"."contentType" IS E'Whether this slider row renders courses (COURSE, default), projects (PROJECT) or jobs (JOB). PROJECT rows compose their membership from the ProjectSliderCourseGroup / ProjectSliderProjectGroup selections. JOB rows compose their membership from the JobSliderJobType selections.';
