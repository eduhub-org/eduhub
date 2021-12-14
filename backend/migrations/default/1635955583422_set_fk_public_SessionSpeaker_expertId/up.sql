alter table "public"."SessionSpeaker"
  add constraint "SessionSpeaker_expertId_fkey"
  foreign key ("expertId")
  references "public"."Expert"
  ("id") on update restrict on delete restrict;
