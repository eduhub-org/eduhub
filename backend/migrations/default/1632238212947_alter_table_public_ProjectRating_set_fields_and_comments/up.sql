DELETE FROM "public"."ProjectRating";
INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'UNRATED', E'The project record has not been reviewed yet.');
INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'PASSED', E'The project record is considered as sufficient to pass.');
INSERT INTO "public"."ProjectRating"("value", "comment") VALUES (E'FAILED', E'The project record is not considered as sufficient to pass.');
