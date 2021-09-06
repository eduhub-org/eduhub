comment on column "public"."Attendance"."TotalTime" is E'If there were interruptions, it is less then endDateTime-StartDateTime.';
alter table "public"."Attendance" rename column "TotalTime" to "totalAttendanceTime";
