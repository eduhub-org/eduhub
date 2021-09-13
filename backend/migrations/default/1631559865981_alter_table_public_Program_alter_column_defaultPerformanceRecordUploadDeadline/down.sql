alter table "public"."Program" rename column "performanceRecordUploadDeadline" to "defaultPerformanceRecordUploadDeadline";
comment on column "public"."Program"."defaultPerformanceRecordUploadDeadline" is E'The default deadline for performance record uploads. It can be changed on the course level.';
