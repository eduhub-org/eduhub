alter table "public"."CertificateTemplateText"
  add constraint "CertificateTemplateText_recordType_fkey"
  foreign key ("recordType")
  references "public"."AchievementRecordType"
  ("value") on update restrict on delete restrict;
