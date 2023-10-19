alter table "public"."User"
  add constraint "User_status_fkey"
  foreign key ("status")
  references "public"."UserStatus"
  ("value") on update restrict on delete restrict;
