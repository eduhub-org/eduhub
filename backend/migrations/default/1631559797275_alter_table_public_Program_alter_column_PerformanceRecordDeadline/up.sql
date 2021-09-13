comment on column "public"."Program"."PerformanceRecordDeadline" is E'The default deadline for performance record uploads. It can be changed on the course level.';
alter table "public"."Program" rename column "PerformanceRecordDeadline" to "defaultPerformanceRecordUploadDeadline";
