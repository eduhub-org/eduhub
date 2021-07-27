ALTER TABLE "public"."Person" ALTER COLUMN "AnonymId" SET NOT NULL;
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_AnonymId_key" UNIQUE ("AnonymId");
