ALTER TABLE "public"."Enrollment" ALTER COLUMN "Status" TYPE integer;
ALTER TABLE ONLY "public"."Enrollment" ALTER COLUMN "Status" DROP DEFAULT;
