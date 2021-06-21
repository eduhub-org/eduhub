ALTER TABLE "public"."MotivationGrade" ADD COLUMN "updated_at" timestamptz;
ALTER TABLE "public"."MotivationGrade" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "public"."MotivationGrade" ALTER COLUMN "updated_at" SET DEFAULT now();
