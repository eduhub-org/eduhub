alter table "public"."User" drop constraint "User_university_fkey",
  add constraint "Person_University_fkey"
  foreign key ("employment")
  references "public"."Employment"
  ("value") on update set null on delete set null;
