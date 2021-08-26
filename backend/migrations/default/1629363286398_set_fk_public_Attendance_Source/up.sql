alter table "public"."Attendance"
  add constraint "Attendance_Source_fkey"
  foreign key ("Source")
  references "public"."AttendanceSource"
  ("Value") on update restrict on delete restrict;
