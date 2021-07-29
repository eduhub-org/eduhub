alter table "public"."Enrollment"
  add constraint "Enrollment_ParticipantId_fkey"
  foreign key ("ParticipantId")
  references "public"."Participant"
  ("Id") on update restrict on delete restrict;
