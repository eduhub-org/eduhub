CREATE TABLE "public"."Weekdays" ("value" text NOT NULL, "comment" text NOT NULL, PRIMARY KEY ("value") , UNIQUE ("value"));COMMENT ON TABLE "public"."Weekdays" IS E'List for how to save weekdays';
