-- One AppSettings row per StuJo portal (branding is filled in via the
-- admin UI; domains follow the current subdomain scheme).
INSERT INTO "public"."AppSettings" ("appName", "domain", "defaultLocale") VALUES
  ('stujo', 'www.stujo.net', 'DE'),
  ('stujo-cau', 'cau.stujo.net', 'DE'),
  ('stujo-haw-kiel', 'haw-kiel.stujo.net', 'DE'),
  ('stujo-flensburg', 'flensburg.stujo.net', 'DE');
