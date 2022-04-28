alter table "public"."ProjectEnrollment" drop constraint "ProjectEnrollment_projectId_fkey",
  add constraint "ProjectEnrollment_ProjectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update restrict on delete restrict;
