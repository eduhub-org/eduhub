BEGIN TRANSACTION;
ALTER TABLE "public"."AppSettings" DROP CONSTRAINT "AppSettings_pkey";

ALTER TABLE "public"."AppSettings"
    ADD CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id", "appName");
COMMIT TRANSACTION;
