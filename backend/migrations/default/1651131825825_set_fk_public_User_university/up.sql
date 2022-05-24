alter table "public"."User" drop constraint "Person_University_fkey",
  add constraint "User_university_fkey"
  foreign key ("university")
  references "public"."University"
  ("value") on update set null on delete set null;
