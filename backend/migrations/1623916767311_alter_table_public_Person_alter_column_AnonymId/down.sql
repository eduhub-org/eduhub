ALTER TABLE "public"."Person" ALTER COLUMN "AnonymId" DROP NOT NULL;
ALTER TABLE "public"."Person" DROP CONSTRAINT "Person_AnonymId_key";
