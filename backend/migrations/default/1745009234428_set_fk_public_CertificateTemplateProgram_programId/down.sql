alter table "public"."CertificateTemplateProgram" drop constraint "CertificateTemplateProgram_programId_fkey",
  add constraint "CertificateTemplateProgram_program_fkey"
  foreign key ("programId")
  references "public"."Program"
  ("id") on update restrict on delete restrict;
