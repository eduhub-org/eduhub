ALTER TABLE "public"."CourseEnrollment" ADD CONSTRAINT "uniqueUserCourse" UNIQUE("userId", "courseId");
