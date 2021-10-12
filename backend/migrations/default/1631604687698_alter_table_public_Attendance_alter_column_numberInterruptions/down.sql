alter table "public"."Attendance" rename column "interruptionCount" to "numberInterruptions";
comment on column "public"."Attendance"."numberInterruptions" is NULL;
