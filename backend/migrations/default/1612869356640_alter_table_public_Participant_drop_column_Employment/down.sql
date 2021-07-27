ALTER TABLE "public"."Participant" ADD COLUMN "Employment" text;
ALTER TABLE "public"."Participant" ALTER COLUMN "Employment" DROP NOT NULL;
