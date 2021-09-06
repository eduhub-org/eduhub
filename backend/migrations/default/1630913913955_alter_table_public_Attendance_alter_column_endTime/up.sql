comment on column "public"."Attendance"."endTime" is E'Not necessary completed (usually only in only attendance).';
alter table "public"."Attendance" rename column "endTime" to "endDateTime";
