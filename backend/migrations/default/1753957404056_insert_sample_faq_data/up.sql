-- Insert sample FAQs for the default collection
WITH default_collection AS (
  SELECT id FROM "public"."FaqCollection" WHERE name = 'default'
),
sample_faqs AS (
  INSERT INTO "public"."Faq" ("collectionId")
  SELECT id FROM default_collection
  UNION ALL
  SELECT id FROM default_collection
  UNION ALL
  SELECT id FROM default_collection
  RETURNING id
),
faq_ids AS (
  SELECT id, ROW_NUMBER() OVER () AS row_num FROM sample_faqs
)
-- Insert German translations
INSERT INTO "public"."FaqTranslation" ("faqId", "lang", "question", "answer")
SELECT 
  faq_ids.id,
  'DE',
  CASE faq_ids.row_num
    WHEN 1 THEN 'Was ist EduHub?'
    WHEN 2 THEN 'Wie kann ich mich für Kurse anmelden?'
    WHEN 3 THEN 'Welche Voraussetzungen gibt es für die Teilnahme?'
  END,
  CASE faq_ids.row_num
    WHEN 1 THEN 'EduHub ist eine innovative Lernplattform, die hochwertige Bildungsangebote für alle zugänglich macht. Du kannst hier verschiedene Kurse und Programme entdecken und dich weiterbilden.'
    WHEN 2 THEN 'Du kannst dich ganz einfach über die Webseite für Kurse anmelden. Erstelle zunächst ein Konto, durchstöbere unser Kursangebot und klicke auf "Anmelden" bei dem gewünschten Kurs.'
    WHEN 3 THEN 'Die Voraussetzungen variieren je nach Kurs. Manche Kurse sind für Anfänger geeignet, andere erfordern Vorkenntnisse. Du findest alle Details in der jeweiligen Kursbeschreibung.'
  END
FROM faq_ids;

-- Insert English translations
WITH faq_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS row_num 
  FROM "public"."Faq" 
  WHERE "collectionId" IN (SELECT id FROM "public"."FaqCollection" WHERE name = 'default')
)
INSERT INTO "public"."FaqTranslation" ("faqId", "lang", "question", "answer")
SELECT 
  faq_ids.id,
  'EN',
  CASE faq_ids.row_num
    WHEN 1 THEN 'What is EduHub?'
    WHEN 2 THEN 'How can I register for courses?'
    WHEN 3 THEN 'What are the prerequisites for participation?'
  END,
  CASE faq_ids.row_num
    WHEN 1 THEN 'EduHub is an innovative learning platform that makes high-quality educational opportunities accessible to everyone. You can discover various courses and programs here and advance your education.'
    WHEN 2 THEN 'You can easily register for courses through the website. First create an account, browse our course offerings, and click "Register" for your desired course.'
    WHEN 3 THEN 'Prerequisites vary by course. Some courses are suitable for beginners, others require prior knowledge. You can find all details in the respective course description.'
  END
FROM faq_ids;