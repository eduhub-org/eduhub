UPDATE "public"."AppSettings"
  SET "primaryColor" = NULL, "secondaryColor" = NULL, "logoUrl" = NULL
  WHERE "appName" IN ('stujo-haw-kiel', 'stujo-flensburg');
