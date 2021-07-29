alter table "public"."Enrollment"
  add constraint "Enrollment_UserId_fkey"
  foreign key ("UserId")
  references "public"."User"
  ("Id") on update restrict on delete restrict;
