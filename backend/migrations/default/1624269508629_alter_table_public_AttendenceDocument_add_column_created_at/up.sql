ALTER TABLE "public"."AttendenceDocument" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
