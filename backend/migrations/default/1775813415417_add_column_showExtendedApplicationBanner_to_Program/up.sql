ALTER TABLE "public"."Program"
  ADD COLUMN "showExtendedApplicationBanner" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Program"."showExtendedApplicationBanner" IS 'When true, course tiles may show a banner when the program default application end has passed but a course still accepts applications.';
