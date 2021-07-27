ALTER TABLE "public"."Course" ALTER COLUMN "Status" TYPE integer;
ALTER TABLE ONLY "public"."Course" ALTER COLUMN "Status" DROP DEFAULT;
