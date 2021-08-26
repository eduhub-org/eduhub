alter table "public"."Enrollment"
  add constraint "Enrollment_PerformanceRating_fkey"
  foreign key ("PerformanceRating")
  references "public"."PerformanceRating"
  ("Value") on update restrict on delete restrict;
