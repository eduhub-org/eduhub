ALTER TABLE "public"."CourseStatus" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."CourseStatus" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."CourseStatus" ALTER COLUMN "created_at" SET DEFAULT now();
