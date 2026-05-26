DROP INDEX IF EXISTS "public"."Project_status_idx";

alter table "public"."Project" drop constraint if exists "Project_status_fkey";
