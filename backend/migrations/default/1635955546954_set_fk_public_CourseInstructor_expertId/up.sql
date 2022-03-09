alter table "public"."CourseInstructor"
  add constraint "CourseInstructor_expertId_fkey"
  foreign key ("expertId")
  references "public"."Expert"
  ("id") on update restrict on delete restrict;
