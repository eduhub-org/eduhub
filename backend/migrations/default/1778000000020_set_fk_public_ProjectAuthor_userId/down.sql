DROP INDEX IF EXISTS "public"."ProjectAuthor_userId_idx";

alter table "public"."ProjectAuthor" drop constraint "ProjectAuthor_userId_fkey";
