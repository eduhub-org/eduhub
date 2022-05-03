alter table "public"."User" drop constraint "Person_Employment_fkey",
  add constraint "User_employment_fkey"
  foreign key ("employment")
  references "public"."Employment"
  ("value") on update set null on delete set null;
