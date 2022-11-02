alter table "public"."Program" rename column "achievementRecordUploadDeadline" to "projectRecordUploadDeadline";
comment on column "public"."Program"."projectRecordUploadDeadline" is E'The deadline for the project record uploads.';
