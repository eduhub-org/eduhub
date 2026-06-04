CREATE TABLE "public"."ProjectParticipationStatus" ("value" text NOT NULL, "comment" text, PRIMARY KEY ("value") );COMMENT ON TABLE "public"."ProjectParticipationStatus" IS E'Acceptance state of a ProjectAuthor: REQUESTED while a user has asked to participate, ACCEPTED once an existing implementing author confirms.';

INSERT INTO "public"."ProjectParticipationStatus"("value", "comment") VALUES (E'REQUESTED', E'User requested to participate as an implementing author; not yet confirmed.');
INSERT INTO "public"."ProjectParticipationStatus"("value", "comment") VALUES (E'ACCEPTED', E'User is a confirmed implementing author of the project.');
