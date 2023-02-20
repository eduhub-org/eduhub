alter table "public"."CourseLocation"
  add constraint "CourseLocation_locationOption_fkey"
  foreign key ("locationOption")
  references "public"."LocationOption"
  ("value") on update restrict on delete restrict;
