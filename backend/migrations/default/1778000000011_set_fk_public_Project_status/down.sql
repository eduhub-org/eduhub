DROP INDEX IF EXISTS "public"."Project_status_idx";

alter table "public"."Project" drop constraint "Project_status_fkey";
