alter table "public"."Teacher"
  add constraint "Teacher_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update cascade on delete cascade;
