alter table "public"."Program"
  add constraint "Program_achievementCertificateTemplateTextId_fkey"
  foreign key ("achievementCertificateTemplateTextId")
  references "public"."CertificateTemplateText"
  ("id") on update restrict on delete restrict;
