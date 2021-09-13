comment on column "public"."Program"."VisibilityPerformanceCertificate" is E'Sets the achievement certificates for all courses of htis program to be visible for the recipients.';
alter table "public"."Program" rename column "VisibilityPerformanceCertificate" to "visibilityAchievementCertificate";
