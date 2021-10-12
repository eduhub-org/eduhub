alter table "public"."SessionSpeaker"
  add constraint "SessionSpeaker_sessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("Id") on update restrict on delete restrict;
