ALTER TABLE "public"."MotivationGrade" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."MotivationGrade" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."MotivationGrade" ALTER COLUMN "created_at" SET DEFAULT now();
