alter table "public"."User"
  add constraint "User_organizationId_fkey"
  foreign key ("organizationId")
  references "public"."Organization"
  ("id") on update restrict on delete restrict;
