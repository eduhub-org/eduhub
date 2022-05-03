alter table "public"."CourseProject" drop constraint "CourseProjects_projectId_fkey",
  add constraint "CourseProject_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update cascade on delete cascade;
