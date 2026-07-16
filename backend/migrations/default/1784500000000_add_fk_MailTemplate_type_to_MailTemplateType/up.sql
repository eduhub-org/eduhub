-- Wire MailTemplate.type to the MailTemplateType enum table so Hasura can
-- track MailTemplateType as is_enum and expose MailTemplateType_enum.
ALTER TABLE "public"."MailTemplate"
  ADD CONSTRAINT "MailTemplate_type_fkey"
  FOREIGN KEY ("type") REFERENCES "public"."MailTemplateType"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;
