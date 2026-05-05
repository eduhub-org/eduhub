alter table "public"."Project"
  add constraint "Project_status_fkey"
  foreign key ("status")
  references "public"."ProjectStatus"
  ("value") on update restrict on delete restrict;
