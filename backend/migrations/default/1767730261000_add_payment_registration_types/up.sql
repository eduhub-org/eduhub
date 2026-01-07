-- Add payment registration types to CourseRegistrationType enum
INSERT INTO "public"."CourseRegistrationType" ("value", "comment") VALUES 
  ('DIRECT_WITH_INPUT_AND_PAYMENT', 'Direct registration with survey and payment'),
  ('DIRECT_CONFIRMATION_AND_PAYMENT', 'Direct registration with payment only')
ON CONFLICT ("value") DO NOTHING;

