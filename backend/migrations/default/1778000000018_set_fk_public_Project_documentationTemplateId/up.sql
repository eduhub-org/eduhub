alter table "public"."Project"
  add constraint "Project_documentationTemplateId_fkey"
  foreign key ("documentationTemplateId")
  references "public"."ProjectDocumentationTemplate"
  ("id") on update restrict on delete restrict;

CREATE INDEX "Project_documentationTemplateId_idx" ON "public"."Project" ("documentationTemplateId") WHERE "documentationTemplateId" IS NOT NULL;
