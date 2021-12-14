alter table "public"."Expert"
  add constraint "Instructor_UserId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
