alter table "public"."Enrollment"
           add constraint "Enrollment_Status_fkey"
           foreign key ("Status")
           references "public"."EnrollmentStatus"
           ("Value") on update restrict on delete restrict;
