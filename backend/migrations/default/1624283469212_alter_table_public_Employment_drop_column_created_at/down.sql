ALTER TABLE "public"."Employment" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."Employment" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."Employment" ALTER COLUMN "created_at" SET DEFAULT now();
