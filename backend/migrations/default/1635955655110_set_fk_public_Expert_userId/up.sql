alter table "public"."Expert"
  add constraint "Expert_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
