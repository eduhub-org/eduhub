alter table "public"."ProjectEnrollment" drop constraint "ProjectEnrollment_ProjectId_fkey",
  add constraint "ProjectEnrollment_projectId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update cascade on delete cascade;
