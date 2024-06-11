alter table "public"."CertificateTemplateText"
  add constraint "CertificateTemplateText_certificateType_fkey"
  foreign key ("certificateType")
  references "public"."CertificateType"
  ("value") on update restrict on delete restrict;
