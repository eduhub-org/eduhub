alter table "public"."Project"
  add constraint "Project_documentationTemplateId_fkey"
  foreign key ("documentationTemplateId")
  references "public"."ProjectDocumentationTemplate"
  ("id") on update restrict on delete restrict;
