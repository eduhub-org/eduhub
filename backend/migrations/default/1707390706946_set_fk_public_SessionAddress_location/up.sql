alter table "public"."SessionAddress"
  add constraint "SessionAddress_location_fkey"
  foreign key ("location")
  references "public"."LocationOption"
  ("value") on update restrict on delete restrict;
