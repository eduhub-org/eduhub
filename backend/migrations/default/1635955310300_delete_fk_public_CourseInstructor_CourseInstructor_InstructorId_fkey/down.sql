alter table "public"."CourseInstructor"
  add constraint "CourseInstructor_InstructorId_fkey"
  foreign key ("expertId")
  references "public"."Expert"
  ("id") on update restrict on delete restrict;
