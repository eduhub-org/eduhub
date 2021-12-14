alter table "public"."Admin"
  add constraint "Admin_UserId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
