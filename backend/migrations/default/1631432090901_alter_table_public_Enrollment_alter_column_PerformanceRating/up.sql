comment on column "public"."Enrollment"."PerformanceRating" is E'The instructor\'s or admin\'s rating of the uploaded project record';
alter table "public"."Enrollment" rename column "PerformanceRating" to "projectRating";
