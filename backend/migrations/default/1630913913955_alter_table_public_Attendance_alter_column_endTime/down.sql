alter table "public"."Attendance" rename column "endDateTime" to "endTime";
comment on column "public"."Attendance"."endTime" is NULL;
