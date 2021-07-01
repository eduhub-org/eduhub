ALTER TABLE "public"."Enrollment" ALTER COLUMN "MotivationGrade" TYPE integer;
ALTER TABLE ONLY "public"."Enrollment" ALTER COLUMN "MotivationGrade" DROP DEFAULT;
