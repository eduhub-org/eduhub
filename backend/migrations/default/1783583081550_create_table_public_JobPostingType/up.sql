-- Job posting types, ported 1:1 from the StuJo Rails categories.
CREATE TABLE "public"."JobPostingType" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."JobPostingType" IS 'Job posting types (StuJo categories). Display labels live in frontend i18n';

INSERT INTO "public"."JobPostingType" ("value", "comment") VALUES
  ('MINIJOB', 'Minijob (StuJo: Minijobs) - free to post'),
  ('WORKING_STUDENT', 'Working student position (StuJo: Studentenjobs)'),
  ('INTERNSHIP', 'Internship (StuJo: Praktika)'),
  ('THESIS', 'Thesis position (StuJo: Abschlussarbeiten)'),
  ('PERMANENT', 'Permanent position (StuJo: Festanstellungen)'),
  ('TRAINEE', 'Trainee position (StuJo: Trainees)'),
  ('STATE_RECOGNITION_INTERNSHIP', 'Internship for state recognition (StuJo: Praktika fuer die staatliche Anerkennung)');
