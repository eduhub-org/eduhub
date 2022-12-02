alter table "public"."SessionAddress"
  add constraint "SessionAddress_type_fkey"
  foreign key ("type")
  references "public"."SessionAddressType"
  ("value") on update restrict on delete restrict;
