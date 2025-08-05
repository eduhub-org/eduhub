-- Add unique constraint to MailTemplate title field to prevent duplicate template names
ALTER TABLE "public"."MailTemplate" ADD CONSTRAINT "MailTemplate_title_key" UNIQUE ("title"); 