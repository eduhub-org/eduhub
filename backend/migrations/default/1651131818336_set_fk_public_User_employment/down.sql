alter table "public"."User" drop constraint "User_employment_fkey",
  add constraint "Person_Employment_fkey"
  foreign key ("employment")
  references "public"."Employment"
  ("value") on update restrict on delete restrict;
