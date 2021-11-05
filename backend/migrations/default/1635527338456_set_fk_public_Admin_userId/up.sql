alter table "public"."Admin"
  add constraint "Admin_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
