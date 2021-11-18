comment on column "public"."Session"."CourseId" is E'The ID of the course the session belongs to';
alter table "public"."Session" rename column "CourseId" to "courseId";
