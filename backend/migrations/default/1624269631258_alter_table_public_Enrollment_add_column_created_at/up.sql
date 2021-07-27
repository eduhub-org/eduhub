ALTER TABLE "public"."Enrollment" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
