alter table "public"."Attendance" drop constraint "Attendance_status_fkey",
  add constraint "Attendance_Status_fkey"
  foreign key ("status")
  references "public"."AttendanceStatus"
  ("value") on update restrict on delete restrict;
