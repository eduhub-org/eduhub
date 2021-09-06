comment on column "public"."Attendance"."Source" is E'New entries are added by a serverless function responsible for the attendance registration.';
alter table "public"."Attendance"
  add constraint "Attendance_Source_fkey"
  foreign key (Source)
  references "public"."AttendanceSource"
  (Value) on update restrict on delete restrict;
alter table "public"."Attendance" alter column "Source" drop not null;
alter table "public"."Attendance" add column "Source" text;
