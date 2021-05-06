ALTER TABLE "public"."Participant" ADD COLUMN "SurveyId" text;
ALTER TABLE "public"."Participant" ALTER COLUMN "SurveyId" DROP NOT NULL;
