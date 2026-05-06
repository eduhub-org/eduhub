DROP INDEX IF EXISTS "public"."Project_proposedByUserId_idx";

alter table "public"."Project" drop constraint if exists "Project_proposedByUserId_fkey";
