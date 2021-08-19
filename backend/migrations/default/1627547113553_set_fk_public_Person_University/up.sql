alter table "public"."Person"
  add constraint "Person_University_fkey"
  foreign key ("University")
  references "public"."University"
  ("Value") on update restrict on delete restrict;
