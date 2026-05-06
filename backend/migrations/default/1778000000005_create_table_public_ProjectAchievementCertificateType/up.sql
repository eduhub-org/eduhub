CREATE TABLE "public"."ProjectAchievementCertificateType" ("value" text NOT NULL, "comment" text, PRIMARY KEY ("value") );COMMENT ON TABLE "public"."ProjectAchievementCertificateType" IS E'Layout selector for the achievement certificate generated when a project is completed. EduHub also issues attendance certificates, which are unrelated to this table.';

INSERT INTO "public"."ProjectAchievementCertificateType"("value", "comment") VALUES (E'DOCUMENTATION', E'Documentation-style achievement certificate.');
INSERT INTO "public"."ProjectAchievementCertificateType"("value", "comment") VALUES (E'ONLINE_COURSE', E'Online-course completion certificate layout.');
