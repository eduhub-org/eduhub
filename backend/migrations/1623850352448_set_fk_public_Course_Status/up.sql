alter table "public"."Course"
           add constraint "Course_Status_fkey"
           foreign key ("Status")
           references "public"."CourseStatus"
           ("value") on update restrict on delete restrict;
