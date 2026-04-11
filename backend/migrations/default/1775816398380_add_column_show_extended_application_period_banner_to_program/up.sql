ALTER TABLE "public"."Program"
ADD COLUMN "showExtendedApplicationPeriodBanner" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Program"."showExtendedApplicationPeriodBanner" IS
'Controls whether course tiles should show an extended application period banner after the program deadline has passed while individual course deadlines are still open.';
