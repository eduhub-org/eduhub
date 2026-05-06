alter table "public"."ProjectMentor"
  add constraint "ProjectMentor_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;

CREATE INDEX "ProjectMentor_userId_idx" ON "public"."ProjectMentor" ("userId");
