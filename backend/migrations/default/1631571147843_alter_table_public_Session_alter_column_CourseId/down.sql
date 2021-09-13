alter table "public"."Session" rename column "courseId" to "CourseId";
comment on column "public"."Session"."CourseId" is NULL;
