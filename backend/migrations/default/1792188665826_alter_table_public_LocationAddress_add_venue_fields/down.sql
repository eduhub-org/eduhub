ALTER TABLE "public"."LocationAddress"
  DROP COLUMN IF EXISTS "street",
  DROP COLUMN IF EXISTS "zipCode",
  DROP COLUMN IF EXISTS "city",
  DROP COLUMN IF EXISTS "country",
  DROP COLUMN IF EXISTS "addressAdditionalInfo",
  DROP COLUMN IF EXISTS "directions",
  DROP COLUMN IF EXISTS "accessibilityInfo",
  DROP COLUMN IF EXISTS "latitude",
  DROP COLUMN IF EXISTS "longitude",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "image",
  DROP COLUMN IF EXISTS "imageCredits",
  DROP COLUMN IF EXISTS "websiteUrl",
  DROP COLUMN IF EXISTS "publicEmail",
  DROP COLUMN IF EXISTS "publicPhone",
  DROP COLUMN IF EXISTS "instagramUrl",
  DROP COLUMN IF EXISTS "rausgegangenLocationId",
  DROP COLUMN IF EXISTS "rausgegangenLocationOwned";

DROP TABLE IF EXISTS "public"."LocationAddressCategory";
