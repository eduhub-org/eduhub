alter table "public"."Course"
           add constraint "Course_SemesterId_fkey"
           foreign key ("SemesterId")
           references "public"."Semester"
           ("Id") on update restrict on delete restrict;
