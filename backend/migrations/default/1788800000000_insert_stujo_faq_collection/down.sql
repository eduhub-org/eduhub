-- Faq and FaqTranslation are removed by the ON DELETE CASCADE chain from
-- FaqCollection.
DELETE FROM "public"."FaqCollection" WHERE "name" = 'stujo';
