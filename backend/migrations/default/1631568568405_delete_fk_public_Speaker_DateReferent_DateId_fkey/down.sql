alter table "public"."Speaker"
  add constraint "DateReferent_DateId_fkey"
  foreign key ("SessionId")
  references "public"."Session"
  ("Id") on update restrict on delete restrict;
