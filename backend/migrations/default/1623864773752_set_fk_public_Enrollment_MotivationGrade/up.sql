alter table "public"."Enrollment"
           add constraint "Enrollment_MotivationGrade_fkey"
           foreign key ("MotivationGrade")
           references "public"."MotivationGrade"
           ("Value") on update restrict on delete restrict;
