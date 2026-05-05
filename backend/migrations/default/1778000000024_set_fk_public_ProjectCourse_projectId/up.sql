alter table "public"."ProjectCourse"
  add constraint "ProjectCourse_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update restrict on delete cascade;
