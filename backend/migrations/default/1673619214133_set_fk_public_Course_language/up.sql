alter table "public"."Course"
  add constraint "Course_language_fkey"
  foreign key ("language")
  references "public"."Language"
  ("value") on update restrict on delete restrict;
