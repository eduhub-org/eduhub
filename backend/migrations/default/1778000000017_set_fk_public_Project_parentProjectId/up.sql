alter table "public"."Project"
  add constraint "Project_parentProjectId_fkey"
  foreign key ("parentProjectId")
  references "public"."Project"
  ("id") on update restrict on delete set null;
