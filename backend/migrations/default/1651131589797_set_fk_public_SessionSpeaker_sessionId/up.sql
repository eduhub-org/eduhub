alter table "public"."SessionSpeaker" drop constraint "SessionSpeaker_sessionId_fkey",
  add constraint "SessionSpeaker_sessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update cascade on delete cascade;
