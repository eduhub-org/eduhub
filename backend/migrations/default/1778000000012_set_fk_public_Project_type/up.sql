alter table "public"."Project"
  add constraint "Project_type_fkey"
  foreign key ("type")
  references "public"."ProjectType"
  ("value") on update restrict on delete restrict;
