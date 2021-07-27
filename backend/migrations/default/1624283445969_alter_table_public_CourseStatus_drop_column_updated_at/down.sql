ALTER TABLE "public"."CourseStatus" ADD COLUMN "updated_at" timestamptz;
ALTER TABLE "public"."CourseStatus" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "public"."CourseStatus" ALTER COLUMN "updated_at" SET DEFAULT now();
