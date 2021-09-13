alter table "public"."Enrollment" rename column "projectRating" to "PerformanceRating";
comment on column "public"."Enrollment"."PerformanceRating" is NULL;
