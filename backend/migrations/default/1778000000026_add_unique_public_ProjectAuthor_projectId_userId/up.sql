alter table "public"."ProjectAuthor"
  add constraint "ProjectAuthor_projectId_userId_key"
  unique ("projectId", "userId");
