ALTER TABLE "public"."Participant" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
