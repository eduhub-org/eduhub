alter table "public"."Project"
  add constraint "Project_achievementCertificateType_fkey"
  foreign key ("achievementCertificateType")
  references "public"."ProjectAchievementCertificateType"
  ("value") on update restrict on delete restrict;
