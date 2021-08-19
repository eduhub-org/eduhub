alter table "public"."Course"
  add constraint "Course_LocationId_fkey"
  foreign key ("LocationId")
  references "public"."Location"
  ("Id") on update restrict on delete restrict;
