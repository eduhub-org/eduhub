-- Occupations added in production after the original seeds (found while
-- validating the ETL against the 2026-07-10 production dump).
INSERT INTO "public"."JobOccupation" ("value", "comment") VALUES
  ('TOURISM', 'Tourismus'),
  ('EVENT_MANAGEMENT', 'Event Management'),
  ('CONSULTING', 'Unternehmensberatung'),
  ('REAL_ESTATE', 'Immobilien'),
  ('SOCIAL_MEDIA', 'Social Media'),
  ('SOCIAL_PEDAGOGY', 'Sozialpaedagogik');
