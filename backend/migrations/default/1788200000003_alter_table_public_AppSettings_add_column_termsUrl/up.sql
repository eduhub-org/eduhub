ALTER TABLE "public"."AppSettings" ADD COLUMN "termsUrl" text NULL;

COMMENT ON COLUMN "public"."AppSettings"."termsUrl" IS 'Terms and conditions (AGB) URL for this white-label portal, shown in the footer and next to the paid-publish button. Null falls back to the StuJo default, matching how imprintUrl and privacyUrl behave.';
