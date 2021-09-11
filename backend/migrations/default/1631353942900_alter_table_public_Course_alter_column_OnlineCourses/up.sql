comment on column "public"."Course"."OnlineCourses" is E'An array of texts, each providing a name for a set of online course participants will have to complete for the performance certificate.';
alter table "public"."Course" rename column "OnlineCourses" to "onlineCourses";
