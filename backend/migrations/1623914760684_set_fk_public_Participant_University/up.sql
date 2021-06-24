alter table "public"."Participant"
           add constraint "Participant_University_fkey"
           foreign key ("University")
           references "public"."University"
           ("Value") on update restrict on delete restrict;
