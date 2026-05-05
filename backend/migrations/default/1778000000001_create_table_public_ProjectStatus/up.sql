CREATE TABLE "public"."ProjectStatus" ("value" text NOT NULL, "comment" text, PRIMARY KEY ("value") );COMMENT ON TABLE "public"."ProjectStatus" IS E'Lifecycle status of a project (replaces the implicit status derived from AchievementRecord.rating).';

INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'PROPOSED', E'Open template proposed by an organization or user; not yet started by a confirmed team.');
INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'ONGOING', E'Implementing authors are fixed and the project is in progress.');
INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'SUBMITTED', E'Authors have marked the project as ready for instructor review.');
INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'COMPLETED', E'Project has been reviewed and rated as passed.');
INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'INCOMPLETE', E'Project ended without successful completion.');
INSERT INTO "public"."ProjectStatus"("value", "comment") VALUES (E'PUBLISHED', E'Completed project is published in the public showcase.');
