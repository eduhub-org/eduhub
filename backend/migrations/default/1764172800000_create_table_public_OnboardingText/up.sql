CREATE TABLE "public"."OnboardingText" (
  "id" serial NOT NULL,
  "programType" text NOT NULL,
  "lang" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("programType", "lang")
);

COMMENT ON TABLE "public"."OnboardingText" IS E'Localized onboarding texts by program type';

ALTER TABLE "public"."OnboardingText"
ADD CONSTRAINT "OnboardingText_programType_fkey"
FOREIGN KEY ("programType") REFERENCES "public"."ProgramType"("value")
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."OnboardingText"
ADD CONSTRAINT "OnboardingText_lang_fkey"
FOREIGN KEY ("lang") REFERENCES "public"."Language"("value")
ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TRIGGER "set_public_OnboardingText_updated_at"
BEFORE UPDATE ON "public"."OnboardingText"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_OnboardingText_updated_at" ON "public"."OnboardingText"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

INSERT INTO "public"."OnboardingText" ("programType", "lang", "text") VALUES
  (
    'COURSES',
    'DE',
    E'# Aktion erforderlich: Kursteilnahme bestätigen\n\n## Herzlichen Glückwunsch\n\nHerzlichen Glückwunsch zur Einladung! Bitte überprüfe unten deine Profilangaben. Deine Angaben sind uns wichtig, um unser zukünftiges Programmangebot besser auf deine Bedürfnisse abzustimmen.\n\n## Nur bestätigen, wenn du Zeit hast\n\nBitte bestätige deine Teilnahme nur, wenn du ausreichend Zeit hast, den Kurs wie in der Kursbeschreibung angegeben bis zum Ende zu besuchen.'
  ),
  (
    'COURSES',
    'EN',
    E'# Action required: Confirm your course participation\n\n## Congratulations\n\nCongratulations on being invited! Please review your profile details below. Your information is important to us so we can better align our future program offerings to your needs.\n\n## Confirm only if you have time\n\nPlease only confirm your participation if you have sufficient time to attend the course until the end, as indicated in the course description.'
  ),
  (
    'EVENTS',
    'DE',
    E'# Aktion erforderlich: Veranstaltungsteilnahme bestätigen\n\n## Herzlichen Glückwunsch\n\nHerzlichen Glückwunsch zur Einladung! Bitte überprüfe unten deine Profilangaben. Deine Angaben sind uns wichtig, um unser zukünftiges Programmangebot besser auf deine Bedürfnisse abzustimmen.\n\n## Nur bestätigen, wenn du Zeit hast\n\nBitte bestätige deine Teilnahme nur, wenn du ausreichend Zeit hast, an der Veranstaltung wie in der Beschreibung angegeben teilzunehmen.'
  ),
  (
    'EVENTS',
    'EN',
    E'# Action required: Confirm your event participation\n\n## Congratulations\n\nCongratulations on being invited! Please review your profile details below. Your information is important to us so we can better align our future program offerings to your needs.\n\n## Confirm only if you have time\n\nPlease only confirm your participation if you have sufficient time to attend the event as indicated in the event description.'
  ),
  (
    'DEGREES',
    'DE',
    E'# Aktion erforderlich: Teilnahme am Studienprogramm bestätigen\n\n## Herzlichen Glückwunsch\n\nHerzlichen Glückwunsch zur Einladung! Bitte überprüfe unten deine Profilangaben. Deine Angaben sind uns wichtig, um unser zukünftiges Programmangebot besser auf deine Bedürfnisse abzustimmen.\n\n## Nur bestätigen, wenn du Zeit hast\n\nBitte bestätige deine Teilnahme nur, wenn du ausreichend Zeit hast, das Studienprogramm wie in der Beschreibung angegeben zu absolvieren.'
  ),
  (
    'DEGREES',
    'EN',
    E'# Action required: Confirm your degree program participation\n\n## Congratulations\n\nCongratulations on being invited! Please review your profile details below. Your information is important to us so we can better align our future program offerings to your needs.\n\n## Confirm only if you have time\n\nPlease only confirm your participation if you have sufficient time to complete the degree program as indicated in the program description.'
  );
