alter table "public"."Course"
  add constraint "Course_weekDay_fkey"
  foreign key ("weekDay")
  references "public"."Weekday"
  ("value") on update restrict on delete restrict;
