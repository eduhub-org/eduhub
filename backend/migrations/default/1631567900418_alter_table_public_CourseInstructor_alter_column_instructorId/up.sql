comment on column "public"."CourseInstructor"."instructorId" is E'ID of the export, who is instructor for the given course';
alter table "public"."CourseInstructor" rename column "instructorId" to "expertId";
