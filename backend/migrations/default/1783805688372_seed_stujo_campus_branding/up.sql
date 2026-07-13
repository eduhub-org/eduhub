-- Campus portal branding, ported 1:1 from the Rails campus stylesheets:
-- fh.scss (HAW Kiel: dark blue/grey) and fl.scss (Campus Flensburg:
-- blue/orange). The root portal and CAU use the default StuJo pink/green
-- scheme, which is baked into the frontend CSS (globals.css) — their
-- AppSettings rows stay NULL so the exact static values apply. The
-- header/footer gradient dark end is derived from primaryColor in the
-- frontend (color-mix), so only primary/secondary are stored. Campus
-- logos are served from the stujo app's public/ dir; CAU uses the root
-- StuJo logo like on the live site.
UPDATE "public"."AppSettings"
  SET "primaryColor" = '#04305E', "secondaryColor" = '#646363',
      "logoUrl" = '/haw-kiel/logo_combined.png'
  WHERE "appName" = 'stujo-haw-kiel';

UPDATE "public"."AppSettings"
  SET "primaryColor" = '#025095', "secondaryColor" = '#EC6707',
      "logoUrl" = '/flensburg/logo_combined.png'
  WHERE "appName" = 'stujo-flensburg';
