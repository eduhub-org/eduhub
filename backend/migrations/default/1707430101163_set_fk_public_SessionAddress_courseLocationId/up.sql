alter table "public"."SessionAddress"
  add constraint "SessionAddress_courseLocationId_fkey"
  foreign key ("courseLocationId")
  references "public"."CourseLocation"
  ("id") on update restrict on delete cascade;
