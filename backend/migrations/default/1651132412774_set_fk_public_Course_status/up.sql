alter table "public"."Course" drop constraint "Course_Status_fkey",
  add constraint "Course_status_fkey"
  foreign key ("status")
  references "public"."CourseStatus"
  ("value") on update set null on delete set null;
