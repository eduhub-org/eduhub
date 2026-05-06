DROP INDEX IF EXISTS "public"."Project_parentProjectId_idx";

alter table "public"."Project" drop constraint "Project_parentProjectId_fkey";
