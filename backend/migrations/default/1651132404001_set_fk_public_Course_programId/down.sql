alter table "public"."Course" drop constraint "Course_programId_fkey",
  add constraint "Course_SemesterId_fkey"
  foreign key ("programId")
  references "public"."Program"
  ("id") on update restrict on delete restrict;
