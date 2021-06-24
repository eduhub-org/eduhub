ALTER TABLE "public"."Event" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
