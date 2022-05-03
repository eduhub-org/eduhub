alter table "public"."Attendance" drop constraint "Attendance_userId_fkey",
  add constraint "Attendance_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
