comment on column "public"."Course"."Visibility" is E'The value decides whether the course is visible for users or anoymous persons.';
alter table "public"."Course" rename column "Visibility" to "visibility";
