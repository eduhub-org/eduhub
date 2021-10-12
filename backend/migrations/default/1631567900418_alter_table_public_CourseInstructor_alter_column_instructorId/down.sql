alter table "public"."CourseInstructor" rename column "expertId" to "instructorId";
comment on column "public"."CourseInstructor"."instructorId" is E'ID of the instructor for the given course ID';
