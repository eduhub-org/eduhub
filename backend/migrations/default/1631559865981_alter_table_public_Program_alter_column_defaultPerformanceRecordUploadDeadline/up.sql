comment on column "public"."Program"."defaultPerformanceRecordUploadDeadline" is E'The deadline for the performance record uploads.';
alter table "public"."Program" rename column "defaultPerformanceRecordUploadDeadline" to "performanceRecordUploadDeadline";
