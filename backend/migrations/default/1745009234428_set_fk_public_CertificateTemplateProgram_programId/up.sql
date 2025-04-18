alter table "public"."CertificateTemplateProgram" drop constraint "CertificateTemplateProgram_program_fkey",
  add constraint "CertificateTemplateProgram_programId_fkey"
  foreign key ("programId")
  references "public"."Program"
  ("id") on update cascade on delete cascade;
