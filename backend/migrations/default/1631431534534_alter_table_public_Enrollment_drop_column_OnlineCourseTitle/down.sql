comment on column "public"."Enrollment"."OnlineCourseTitle" is E'A new enrollment is added as soon as a user applies for a course. It includes all information about a (potential) particiaption in a course.';
alter table "public"."Enrollment" alter column "OnlineCourseTitle" drop not null;
alter table "public"."Enrollment" add column "OnlineCourseTitle" text;
