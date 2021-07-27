ALTER TABLE "public"."EnrollmentStatus" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."EnrollmentStatus" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."EnrollmentStatus" ALTER COLUMN "created_at" SET DEFAULT now();
