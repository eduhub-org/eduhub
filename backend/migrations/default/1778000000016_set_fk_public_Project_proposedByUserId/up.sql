alter table "public"."Project"
  add constraint "Project_proposedByUserId_fkey"
  foreign key ("proposedByUserId")
  references "public"."User"
  ("id") on update restrict on delete restrict;

CREATE INDEX "Project_proposedByUserId_idx" ON "public"."Project" ("proposedByUserId");
