alter table "public"."Program"
  add constraint "Program_attendanceCertificateTemplateTextId_fkey"
  foreign key ("attendanceCertificateTemplateTextId")
  references "public"."CertificateTemplateText"
  ("id") on update restrict on delete restrict;
