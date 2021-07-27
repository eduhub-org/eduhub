ALTER TABLE "public"."Course" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
