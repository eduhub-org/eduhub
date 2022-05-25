alter table "public"."SessionAddress" drop constraint "SessionAddress_sessionId_fkey",
  add constraint "SessionAddress_sessionId_fkey"
  foreign key ("sessionId")
  references "public"."Session"
  ("id") on update restrict on delete restrict;
