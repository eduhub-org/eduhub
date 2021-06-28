ALTER TABLE "public"."Course" ALTER COLUMN "Status" TYPE text;
ALTER TABLE ONLY "public"."Course" ALTER COLUMN "Status" SET DEFAULT 'DRAFT';
