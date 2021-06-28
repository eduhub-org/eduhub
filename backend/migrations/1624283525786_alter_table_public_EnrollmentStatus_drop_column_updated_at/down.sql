ALTER TABLE "public"."EnrollmentStatus" ADD COLUMN "updated_at" timestamptz;
ALTER TABLE "public"."EnrollmentStatus" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "public"."EnrollmentStatus" ALTER COLUMN "updated_at" SET DEFAULT now();
