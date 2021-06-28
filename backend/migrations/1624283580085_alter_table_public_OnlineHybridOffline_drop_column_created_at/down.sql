ALTER TABLE "public"."OnlineHybridOffline" ADD COLUMN "created_at" timestamptz;
ALTER TABLE "public"."OnlineHybridOffline" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "public"."OnlineHybridOffline" ALTER COLUMN "created_at" SET DEFAULT now();
