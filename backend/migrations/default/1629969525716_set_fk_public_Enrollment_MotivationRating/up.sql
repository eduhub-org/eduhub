alter table "public"."Enrollment"
  add constraint "Enrollment_MotivationRating_fkey"
  foreign key ("MotivationRating")
  references "public"."MotivationRating"
  ("Value") on update restrict on delete restrict;
