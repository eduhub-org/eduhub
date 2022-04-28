alter table "public"."AttendanceSourceData" drop constraint "AttendanceSourceData_sessionId_fkey",
  add constraint "AttendenceDocument_SessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update restrict on delete restrict;
