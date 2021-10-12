
INSERT INTO "public"."University"("value", "comment") VALUES (E'CAU_KIEL', E'Christian-Albrechts-Universität zu Kiel');
UPDATE "public"."User" SET university = E'CAU_KIEL' WHERE university = E'CAUKIEL';
DELETE FROM "public"."University" WHERE value=E'CAUKIEL';
INSERT INTO "public"."University"("value", "comment") VALUES (E'FH_KIEL', E'Fachhochschule Kiel');
UPDATE "public"."User" SET university = E'FH_KIEL' WHERE university = E'FHKIEL';
DELETE FROM "public"."University" WHERE value=E'FHKIEL';
INSERT INTO "public"."University"("value", "comment") VALUES (E'UNI_FLENSBURG', E'Europa-Universität Flensburg');
UPDATE "public"."User" SET university = E'UNI_FLENSBURG' WHERE university = E'UNIFLENSBURG';
DELETE FROM "public"."University" WHERE value=E'UNIFLENSBURG';
UPDATE "public"."University" SET comment = E'Duale Hochschule Schleswig-Holstein' WHERE value = E'DHSH';
UPDATE "public"."University" SET comment = E'Muthesius Kunsthochschule, Kiel' WHERE value = E'MUTHESIUS';
UPDATE "public"."University" SET comment = E'A university not listed here' WHERE value = E'OTHER';
INSERT INTO "public"."University"("value", "comment") VALUES (E'UNI_LUEBECK', E'Universität zu Lübeck');
INSERT INTO "public"."University"("value", "comment") VALUES (E'TH_LUEBECK', E'Technische Hochschule Lübeck');
INSERT INTO "public"."University"("value", "comment") VALUES (E'FH_FLENSBURG', E'Hochschule Flensburg');
INSERT INTO "public"."University"("value", "comment") VALUES (E'FH_WESTKUESTE', E'Fachhochschule Westküste');

