ALTER TABLE "public"."Course"
  ADD COLUMN "courseSeriesId" integer NULL;

COMMENT ON COLUMN "public"."Course"."courseSeriesId" IS E'Links this course to its CourseSeries (the set of all iterations of the same course). Used to surface projects from past iterations.';

ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_courseSeriesId_fkey"
  FOREIGN KEY ("courseSeriesId") REFERENCES "public"."CourseSeries"("id") ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX "Course_courseSeriesId_idx" ON "public"."Course" ("courseSeriesId");
