comment on column "public"."Enrollment"."TypeOfProject" is E'A new enrollment is added as soon as a user applies for a course. It includes all information about a (potential) particiaption in a course.';
alter table "public"."Enrollment"
  add constraint "Enrollment_TypeOfProject_fkey"
  foreign key (TypeOfProject)
  references "public"."ProjectType"
  (Value) on update restrict on delete restrict;
alter table "public"."Enrollment" alter column "TypeOfProject" drop not null;
alter table "public"."Enrollment" add column "TypeOfProject" text;
