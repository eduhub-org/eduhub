comment on column "public"."Attendance"."numberInterruptions" is E'The count of the number of interruptions a user had while attending (for online attendance only)';
alter table "public"."Attendance" rename column "numberInterruptions" to "interruptionCount";
