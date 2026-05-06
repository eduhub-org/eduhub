DROP INDEX IF EXISTS "public"."Project_organizationId_idx";

alter table "public"."Project" drop constraint "Project_organizationId_fkey";
