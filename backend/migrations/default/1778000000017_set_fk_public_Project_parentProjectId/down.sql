DROP INDEX IF EXISTS "public"."Project_parentProjectId_idx";

alter table "public"."Project" drop constraint if exists "Project_parentProjectId_fkey";
