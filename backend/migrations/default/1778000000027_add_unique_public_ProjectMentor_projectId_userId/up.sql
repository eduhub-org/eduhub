alter table "public"."ProjectMentor"
  add constraint "ProjectMentor_projectId_userId_key"
  unique ("projectId", "userId");
