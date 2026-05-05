CREATE TABLE "public"."ProjectRating" ("value" text NOT NULL, "comment" text, PRIMARY KEY ("value") );COMMENT ON TABLE "public"."ProjectRating" IS E'Instructor or admin rating of a completed project (mirrors the legacy AchievementRecordRating values).';

INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'UNRATED', E'Project has not yet been rated.');
INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'PASSED', E'Project meets the requirements and has been rated as passed.');
INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'FAILED', E'Project does not meet the requirements.');
