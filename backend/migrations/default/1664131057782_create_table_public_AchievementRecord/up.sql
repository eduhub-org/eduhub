CREATE TABLE "public"."AchievementRecord" ("id" serial NOT NULL, "uploadUserId" integer NOT NULL, "coverImageUrl" text NOT NULL, "description" text NOT NULL, "rating" text NOT NULL, "score" numeric NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."AchievementRecord" IS E'A new row is created whenever a user uploads a new record for an achievement option.';