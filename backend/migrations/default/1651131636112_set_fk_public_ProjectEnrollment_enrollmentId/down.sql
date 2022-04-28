alter table "public"."ProjectEnrollment" drop constraint "ProjectEnrollment_enrollmentId_fkey",
  add constraint "ProjectEnrollment_enrollmentId_fkey"
  foreign key ("projectId")
  references "public"."Project"
  ("id") on update cascade on delete cascade;
