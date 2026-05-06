DROP INDEX IF EXISTS "public"."Project_documentationTemplateId_idx";

alter table "public"."Project" drop constraint if exists "Project_documentationTemplateId_fkey";
