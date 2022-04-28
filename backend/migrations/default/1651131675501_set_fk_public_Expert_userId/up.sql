alter table "public"."Expert" drop constraint "Expert_userId_fkey",
  add constraint "Expert_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update cascade on delete cascade;
