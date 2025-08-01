-- Insert sample FAQs for the default collection
DO $$
DECLARE
    collection_id integer;
    faq1_id integer;
    faq2_id integer;
    faq3_id integer;
BEGIN
    -- Get the default collection ID
    SELECT id INTO collection_id FROM "public"."FaqCollection" WHERE name = 'default';
    
    -- Insert FAQ entries and get their IDs
    INSERT INTO "public"."Faq" ("collectionId") VALUES (collection_id) RETURNING id INTO faq1_id;
    INSERT INTO "public"."Faq" ("collectionId") VALUES (collection_id) RETURNING id INTO faq2_id;
    INSERT INTO "public"."Faq" ("collectionId") VALUES (collection_id) RETURNING id INTO faq3_id;
    
    -- Insert German translations
    INSERT INTO "public"."FaqTranslation" ("faqId", "lang", "question", "answer") VALUES
    (faq1_id, 'DE', 'Was ist EduHub?', 'EduHub ist eine innovative Lernplattform, die hochwertige Bildungsangebote für alle zugänglich macht. Du kannst hier verschiedene Kurse und Programme entdecken und dich weiterbilden.'),
    (faq2_id, 'DE', 'Wie kann ich mich für Kurse anmelden?', 'Du kannst dich ganz einfach über die Webseite für Kurse anmelden. Erstelle zunächst ein Konto, durchstöbere unser Kursangebot und klicke auf "Anmelden" bei dem gewünschten Kurs.'),
    (faq3_id, 'DE', 'Welche Voraussetzungen gibt es für die Teilnahme?', 'Die Voraussetzungen variieren je nach Kurs. Manche Kurse sind für Anfänger geeignet, andere erfordern Vorkenntnisse. Du findest alle Details in der jeweiligen Kursbeschreibung.');
    
    -- Insert English translations
    INSERT INTO "public"."FaqTranslation" ("faqId", "lang", "question", "answer") VALUES
    (faq1_id, 'EN', 'What is EduHub?', 'EduHub is an innovative learning platform that makes high-quality educational opportunities accessible to everyone. You can discover various courses and programs here and advance your education.'),
    (faq2_id, 'EN', 'How can I register for courses?', 'You can easily register for courses through the website. First create an account, browse our course offerings, and click "Register" for your desired course.'),
    (faq3_id, 'EN', 'What are the prerequisites for participation?', 'Prerequisites vary by course. Some courses are suitable for beginners, others require prior knowledge. You can find all details in the respective course description.');
END $$;