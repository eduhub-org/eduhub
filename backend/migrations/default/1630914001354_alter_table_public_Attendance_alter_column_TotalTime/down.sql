alter table "public"."Attendance" rename column "totalAttendanceTime" to "TotalTime";
comment on column "public"."Attendance"."TotalTime" is NULL;
