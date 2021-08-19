alter table "public"."Location"
  add constraint "Location_LocationName_fkey"
  foreign key ("LocationName")
  references "public"."LocationOptions"
  ("Value") on update restrict on delete restrict;
