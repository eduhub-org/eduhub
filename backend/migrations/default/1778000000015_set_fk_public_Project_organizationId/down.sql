DROP INDEX IF EXISTS "public"."Project_organizationId_idx";

alter table "public"."Project" drop constraint if exists "Project_organizationId_fkey";
