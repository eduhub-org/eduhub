-- A CourseGroupOption row now describes either a course slider (default) or a
-- project slider. A row with contentType = 'PROJECT' is a project slider whose
-- membership is composed from the groups selected in the ProjectSlider*
-- selection junctions. Reusing this table lets project sliders interleave by
-- "order" with the course sliders on the homepage.
ALTER TABLE "public"."CourseGroupOption"
  ADD COLUMN "contentType" text NOT NULL DEFAULT 'COURSE';

COMMENT ON COLUMN "public"."CourseGroupOption"."contentType" IS E'Whether this slider row renders courses (COURSE, default) or projects (PROJECT). PROJECT rows compose their membership from the ProjectSliderCourseGroup / ProjectSliderProjectGroup selections.';

ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_contentType_check"
  CHECK ("contentType" IN ('COURSE', 'PROJECT'));
