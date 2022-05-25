alter table "public"."Course" drop constraint "Course_status_fkey",
  add constraint "Course_Status_fkey"
  foreign key ("programId")
  references "public"."Program"
  ("id") on update set null on delete set null;
