alter table "public"."Enrollment"
           add constraint "Enrollment_TypeOfProject_fkey"
           foreign key ("TypeOfProject")
           references "public"."ProjectType"
           ("Value") on update restrict on delete restrict;
