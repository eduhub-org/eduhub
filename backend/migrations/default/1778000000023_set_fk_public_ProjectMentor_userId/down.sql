DROP INDEX IF EXISTS "public"."ProjectMentor_userId_idx";

alter table "public"."ProjectMentor" drop constraint "ProjectMentor_userId_fkey";
