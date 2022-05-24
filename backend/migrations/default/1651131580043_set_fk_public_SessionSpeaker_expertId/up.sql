alter table "public"."SessionSpeaker" drop constraint "SessionSpeaker_expertId_fkey",
  add constraint "SessionSpeaker_expertId_fkey"
  foreign key ("expertId")
  references "public"."Expert"
  ("id") on update cascade on delete cascade;
