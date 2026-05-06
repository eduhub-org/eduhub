alter table "public"."ProjectAuthor"
  add constraint "ProjectAuthor_participationStatus_fkey"
  foreign key ("participationStatus")
  references "public"."ProjectParticipationStatus"
  ("value") on update restrict on delete restrict;
