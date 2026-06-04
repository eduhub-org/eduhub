alter table "public"."ProjectCourse"
  add constraint "ProjectCourse_projectId_courseId_key"
  unique ("projectId", "courseId");
