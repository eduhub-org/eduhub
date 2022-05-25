alter table "public"."CourseProject" drop constraint "CourseProject_projectId_fkey",
  add constraint "CourseProjects_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update restrict on delete restrict;
