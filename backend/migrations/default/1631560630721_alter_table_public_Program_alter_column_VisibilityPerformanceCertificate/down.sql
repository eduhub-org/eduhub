alter table "public"."Program" rename column "visibilityAchievementCertificate" to "VisibilityPerformanceCertificate";
comment on column "public"."Program"."VisibilityPerformanceCertificate" is NULL;
