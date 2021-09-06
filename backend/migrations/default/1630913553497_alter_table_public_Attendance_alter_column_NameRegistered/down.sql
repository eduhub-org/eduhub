alter table "public"."Attendance" rename column "recordedName" to "NameRegistered";
comment on column "public"."Attendance"."NameRegistered" is NULL;
