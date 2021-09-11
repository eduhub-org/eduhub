alter table "public"."CourseProjects"
  add constraint "CourseProjects_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("Id") on update restrict on delete restrict;
