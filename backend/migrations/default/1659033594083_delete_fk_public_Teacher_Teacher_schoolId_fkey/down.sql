alter table "public"."Teacher"
  add constraint "Teacher_schoolId_fkey"
  foreign key ("schoolId")
  references "public"."School"
  ("dstnr") on update cascade on delete cascade;
