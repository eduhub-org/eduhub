alter table "public"."Course" rename column "onlineCourses" to "OnlineCourses";
comment on column "public"."Course"."OnlineCourses" is NULL;
