ALTER TABLE "public"."Course" ADD COLUMN "Semester" text;
ALTER TABLE "public"."Course" ALTER COLUMN "Semester" DROP NOT NULL;
