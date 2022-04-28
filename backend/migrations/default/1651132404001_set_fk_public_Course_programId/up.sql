alter table "public"."Course" drop constraint "Course_SemesterId_fkey",
  add constraint "Course_programId_fkey"
  foreign key ("programId")
  references "public"."Program"
  ("id") on update set null on delete set null;
