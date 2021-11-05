alter table "public"."Attendance"
  add constraint "Attendance_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
