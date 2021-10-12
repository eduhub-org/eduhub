comment on column "public"."ProjectEnrollment"."ProjectId" is E'The ID of the project that is selected as performance record for the enrollment';
alter table "public"."ProjectEnrollment" rename column "ProjectId" to "projectId";
