alter table "public"."ProjectAuthor"
  add constraint "ProjectAuthor_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;

CREATE INDEX "ProjectAuthor_userId_idx" ON "public"."ProjectAuthor" ("userId");
