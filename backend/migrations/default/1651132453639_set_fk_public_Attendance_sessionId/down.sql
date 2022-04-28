alter table "public"."Attendance" drop constraint "Attendance_sessionId_fkey",
  add constraint "Attendence_SessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update restrict on delete restrict;
