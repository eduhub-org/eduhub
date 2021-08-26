alter table "public"."Attendance"
  add constraint "Attendance_Status_fkey"
  foreign key ("Status")
  references "public"."AttendanceStatus"
  ("Value") on update restrict on delete restrict;
