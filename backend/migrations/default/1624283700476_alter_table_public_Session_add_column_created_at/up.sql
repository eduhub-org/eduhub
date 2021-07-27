ALTER TABLE "public"."Session" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
