ALTER TABLE "public"."Enrollment" ALTER COLUMN "MotivationGrade" TYPE text;
ALTER TABLE ONLY "public"."Enrollment" ALTER COLUMN "MotivationGrade" SET DEFAULT 'UNRATED';
