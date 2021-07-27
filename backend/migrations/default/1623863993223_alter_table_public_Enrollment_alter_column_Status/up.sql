ALTER TABLE "public"."Enrollment" ALTER COLUMN "Status" TYPE text;
ALTER TABLE ONLY "public"."Enrollment" ALTER COLUMN "Status" SET DEFAULT 'OPEN';
