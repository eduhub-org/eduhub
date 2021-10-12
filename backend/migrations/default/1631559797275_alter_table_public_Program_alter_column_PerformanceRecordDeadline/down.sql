alter table "public"."Program" rename column "defaultPerformanceRecordUploadDeadline" to "PerformanceRecordDeadline";
comment on column "public"."Program"."PerformanceRecordDeadline" is NULL;
