ALTER TABLE "public"."CourseLocation"
ADD CONSTRAINT unique_courseid_locationoption UNIQUE ("courseId", "locationOption");
