ALTER TABLE "public"."Mail" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
