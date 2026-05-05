alter table "public"."Project"
  add constraint "Project_organizationId_fkey"
  foreign key ("organizationId")
  references "public"."Organization"
  ("id") on update restrict on delete restrict;
