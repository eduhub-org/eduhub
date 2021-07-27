ALTER TABLE "public"."Person" ADD COLUMN "Password" text;
ALTER TABLE "public"."Person" ALTER COLUMN "Password" DROP NOT NULL;
