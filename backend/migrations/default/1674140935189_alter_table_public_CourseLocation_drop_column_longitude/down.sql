comment on column "public"."CourseLocation"."longitude" is E'The course instructor can add one or several of the possible general locations for the administration of a course. Further, either a link to a video conference or GPS coordinates of an actual location can be provided. The latter will be used as defaul values for the location addresses provided in each session.';
alter table "public"."CourseLocation" alter column "longitude" drop not null;
alter table "public"."CourseLocation" add column "longitude" text;
