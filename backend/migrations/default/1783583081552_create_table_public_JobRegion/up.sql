-- Geographic filter regions, ported from the StuJo Rails Region int enum
-- (-2 Flensburg, 0 Kiel, 1 SH+HH, 2 Deutschland, 3 Daenemark, 4 Ausland).
-- Search semantics: KIEL is a subset of SCHLESWIG_HOLSTEIN_HAMBURG (frontend
-- widens the filter accordingly, mirroring "region <= param" in Rails).
CREATE TABLE "public"."JobRegion" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."JobRegion" IS 'Geographic regions for job postings (StuJo region filter)';

INSERT INTO "public"."JobRegion" ("value", "comment") VALUES
  ('FLENSBURG', 'Flensburg (StuJo region -2)'),
  ('KIEL', 'Kiel region (StuJo region 0)'),
  ('SCHLESWIG_HOLSTEIN_HAMBURG', 'Schleswig-Holstein and Hamburg (StuJo region 1)'),
  ('GERMANY', 'Germany (StuJo region 2)'),
  ('DENMARK', 'Denmark (StuJo region 3)'),
  ('ABROAD', 'Other countries (StuJo region 4)');
