alter table "public"."Attendance" drop constraint "Attendence_SessionId_fkey",
  add constraint "Attendance_sessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update cascade on delete cascade;
