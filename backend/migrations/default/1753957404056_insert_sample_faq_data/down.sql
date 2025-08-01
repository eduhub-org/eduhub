-- Delete sample FAQ data
DELETE FROM "public"."FaqTranslation" 
WHERE "faqId" IN (
  SELECT f.id FROM "public"."Faq" f
  JOIN "public"."FaqCollection" fc ON f."collectionId" = fc.id
  WHERE fc.name = 'default'
);

DELETE FROM "public"."Faq" 
WHERE "collectionId" IN (
  SELECT id FROM "public"."FaqCollection" WHERE name = 'default'
);