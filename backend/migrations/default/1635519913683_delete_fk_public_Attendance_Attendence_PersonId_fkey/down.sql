alter table "public"."Attendance"
  add constraint "Attendence_PersonId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
