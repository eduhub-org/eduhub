comment on column "public"."Attendance"."NameRegistered" is E'The name used for the comparison with names of registers';
alter table "public"."Attendance" rename column "NameRegistered" to "recordedName";
