comment on column "public"."Enrollment"."projectRating" is E'A new enrollment is added as soon as a user applies for a course. It includes all information about a (potential) particiaption in a course.';
alter table "public"."Enrollment"
  add constraint "Enrollment_PerformanceRating_fkey"
  foreign key (projectRating)
  references "public"."ProjectRating"
  (value) on update restrict on delete restrict;
alter table "public"."Enrollment" alter column "projectRating" drop not null;
alter table "public"."Enrollment" add column "projectRating" text;
