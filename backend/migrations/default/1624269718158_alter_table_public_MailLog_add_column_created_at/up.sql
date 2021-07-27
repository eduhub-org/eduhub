ALTER TABLE "public"."MailLog" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
