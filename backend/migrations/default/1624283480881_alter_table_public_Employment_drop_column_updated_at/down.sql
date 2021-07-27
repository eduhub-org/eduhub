ALTER TABLE "public"."Employment" ADD COLUMN "updated_at" timestamptz;
ALTER TABLE "public"."Employment" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "public"."Employment" ALTER COLUMN "updated_at" SET DEFAULT now();
