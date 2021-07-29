alter table "public"."Enrollment"
  add constraint "Enrollment_ParticipantId_fkey2"
  foreign key ("ParticipantId")
  references "public"."Person"
  ("Id") on update restrict on delete restrict;
