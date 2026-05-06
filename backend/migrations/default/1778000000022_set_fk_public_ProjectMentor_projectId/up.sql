alter table "public"."ProjectMentor"
  add constraint "ProjectMentor_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update restrict on delete cascade;
