DROP INDEX IF EXISTS "public"."ProjectCourse_courseId_idx";

alter table "public"."ProjectCourse" drop constraint "ProjectCourse_courseId_fkey";
