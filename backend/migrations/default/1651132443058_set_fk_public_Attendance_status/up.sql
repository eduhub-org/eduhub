alter table "public"."Attendance" drop constraint "Attendance_Status_fkey",
  add constraint "Attendance_status_fkey"
  foreign key ("status")
  references "public"."AttendanceStatus"
  ("value") on update set null on delete set null;
