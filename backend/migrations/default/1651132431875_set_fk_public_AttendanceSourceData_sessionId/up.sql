alter table "public"."AttendanceSourceData" drop constraint "AttendenceDocument_SessionId_fkey",
  add constraint "AttendanceSourceData_sessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update cascade on delete cascade;
