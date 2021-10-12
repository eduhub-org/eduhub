alter table "public"."Speaker"
  add constraint "DateReferent_ReferentId_fkey"
  foreign key ("ReferentId")
  references "public"."Referent"
  ("Id") on update restrict on delete restrict;
