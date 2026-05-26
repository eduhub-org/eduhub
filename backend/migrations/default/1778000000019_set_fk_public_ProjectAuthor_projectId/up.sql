alter table "public"."ProjectAuthor"
  add constraint "ProjectAuthor_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update restrict on delete cascade;
