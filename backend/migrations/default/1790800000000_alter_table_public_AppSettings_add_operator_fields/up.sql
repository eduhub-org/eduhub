-- Who runs this EduHub instance, for texts that name the operator (e.g. the
-- instructor confidentiality commitment), and where privacy incidents go.
-- Both optional: texts fall back to neutral wording when they are empty.
ALTER TABLE "public"."AppSettings" ADD COLUMN "operatorName" text NULL;
ALTER TABLE "public"."AppSettings" ADD COLUMN "privacyContactEmail" text NULL;

COMMENT ON COLUMN "public"."AppSettings"."operatorName" IS
  E'Display name of the organisation operating this instance, used in user-facing texts.';
COMMENT ON COLUMN "public"."AppSettings"."privacyContactEmail" IS
  E'Email address for data protection questions and incidents.';

-- Keep the commitment text as it read before this setting existed.
UPDATE "public"."AppSettings" SET "operatorName" = 'opencampus.sh' WHERE "appName" = 'edu';
