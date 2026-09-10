-- StuJo FAQ content, ported from the legacy Rails page (app/views/pages/
-- faq.html.erb on www.stujo.net/faq) into the EduHub Faq tables.
--
-- One shared collection for all StuJo portals: portals are a branding
-- dimension only (docs/STUJO_INTEGRATION_PLAN.md 2.4), so the FAQ is the
-- same everywhere and apps/stujo/pages/faq.tsx names this collection
-- directly.
--
-- The answers are NOT a 1:1 copy: every legacy answer was checked against
-- how the new app actually behaves and corrected where it had drifted
-- (account model, price page URL, 8-week visibility window, Stripe
-- pre-payment instead of the old post-hoc invoice). The legacy question
-- about agencies posting on behalf of third companies is intentionally
-- dropped. German uses the informal "Du" form (AGENTS.md rule 4).

INSERT INTO "public"."FaqCollection" ("name") VALUES ('stujo');

-- 12 entries; display order is insertion order (Faq has no order column,
-- the query breaks the created_at tie on id).
INSERT INTO "public"."Faq" ("collectionId")
SELECT c.id
FROM "public"."FaqCollection" c, generate_series(1, 12)
WHERE c.name = 'stujo';

WITH numbered AS (
  SELECT id, (row_number() OVER (ORDER BY id))::int AS n
  FROM "public"."Faq"
  WHERE "collectionId" = (
    SELECT id FROM "public"."FaqCollection" WHERE name = 'stujo'
  )
),
content (n, lang, question, answer) AS (VALUES
  (1, 'DE',
   'Brauche ich einen Account für die Jobsuche bei StuJo?',
   'Nein. Für die Jobsuche brauchst Du keinen Account. Die neuesten Angebote findest Du direkt auf der Startseite, und unter [Stellenangebote](/stellenangebote) kannst Du nach Kategorie, Ort/Region und Berufsfeld filtern oder nach einem Stichwort bzw. einem Unternehmen suchen.'),
  (2, 'DE',
   'Brauche ich als Unternehmen einen Account bei StuJo und kostet dieser etwas?',
   'Ja. Um ein Stellenangebot zu veröffentlichen, brauchst Du ein Konto bei opencampus.sh – dasselbe Konto wie in EduHub. Nach der Anmeldung wählst Du unter „Mein StuJo“ das Unternehmen aus, für das Du Anzeigen veröffentlichen möchtest. Das Konto selbst ist kostenlos; Kosten entstehen erst beim Veröffentlichen einer kostenpflichtigen Anzeige.'),
  (3, 'DE',
   'Fallen für die Jobsuche Kosten an?',
   'Nein, für die Jobsuche fallen keine Kosten an.'),
  (4, 'DE',
   'Wie viel kostet es, eine Stellenausschreibung zu inserieren?',
   'Eine Übersicht über alle Leistungen und Preise findest Du unter [Für Arbeitgeber](/fuer-arbeitgeber). Minijobs sind kostenlos; alle Preise verstehen sich netto zuzüglich der gesetzlichen Umsatzsteuer.'),
  (5, 'DE',
   'Ist StuJo ausschließlich für Studierende nutzbar?',
   'Der Schwerpunkt von StuJo liegt in der Vermittlung von Studierenden an Unternehmen in der unmittelbaren Umgebung in Schleswig-Holstein und Hamburg. Durch den engen Kontakt zu den Hochschulen in Kiel und Flensburg werden zudem häufig Jobs an der Hochschule selbst ausgeschrieben.'),
  (6, 'DE',
   'Was ist das Besondere an StuJo?',
   'StuJo ist ein im Rahmen von opencampus.sh gegründetes Start-up von Studierenden der Universität Kiel mit dem Ziel, die Jobsuche für den lokalen Markt auf kluge Weise zu vereinfachen. Heute wird StuJo vom gemeinnützigen Verein Campus Business Box e.V. (opencampus.sh) betrieben und läuft auf derselben Plattform wie EduHub – Du nutzt also überall dasselbe Konto. Durch den engen Kontakt zu den lokalen Unternehmen und den Hochschulen in der Umgebung ist StuJo eine sehr persönliche und effektive Brücke zwischen Arbeitgebern und Jobsuchenden.'),
  (7, 'DE',
   'Wie lange sind die Stellenangebote sichtbar?',
   'Ein Angebot bleibt ab der Veröffentlichung 8 Wochen (56 Tage) online und läuft danach automatisch ab. Über einen früheren Bewerbungsschluss kannst Du den Zeitraum individuell verkürzen. Abgelaufene Angebote kannst Du unter „Mein StuJo“ jederzeit erneut inserieren.'),
  (8, 'DE',
   'Wohin fließen die Einnahmen von StuJo?',
   'Die Einnahmen von StuJo decken die Kosten für den Betrieb und die Weiterentwicklung der Plattform. Eventuelle Überschüsse fließen dem gemeinnützigen Verein Campus Business Box e.V. (opencampus.sh) zu. Dieser setzt sich für die Erhaltung eines vielfältigen Arbeitsmarkts sowie für die Förderung der Start-up-Kultur in Schleswig-Holstein ein.'),
  (9, 'DE',
   'Von wem werden die Inserate eingestellt?',
   'Die Inserate werden von den Arbeitgebern selbstständig über das Online-Formular unter „Mein StuJo“ eingestellt. StuJo stellt dafür die Plattform bereit und wird nicht vermittelnd tätig.'),
  (10, 'DE',
   'Können die Anzeigen nachträglich geändert werden?',
   'Ja. Unter „Mein StuJo“ kannst Du Deine Anzeigen jederzeit bearbeiten – auch nach der Veröffentlichung. Die Änderungen sind sofort sichtbar.'),
  (11, 'DE',
   'Aus welchem Umkreis werden Jobangebote inseriert?',
   'Durch die Anbindung an opencampus.sh und die Hochschulen in Kiel und Flensburg liegt der Fokus der Inserate auf diesem Raum und auf ganz Schleswig-Holstein. Angebote aus dem übrigen Deutschland, aus Dänemark und aus dem weiteren Ausland sind aber ebenfalls zu finden und herzlich willkommen.'),
  (12, 'DE',
   'Wie bezahle ich, nachdem ich ein Angebot gebucht habe?',
   'Kostenpflichtige Anzeigen werden per Vorkasse abgerechnet: Beim Veröffentlichen wirst Du zu unserem Zahlungsdienstleister Stripe weitergeleitet und bezahlst dort mit einer der angebotenen Zahlungsarten (z. B. Kreditkarte oder SEPA-Lastschrift). Die Rechnung bekommst Du elektronisch als PDF per E-Mail an die im Konto hinterlegte Adresse, dazu einen Zugriffslink auf das Rechnungsdokument. Ist für Dein Unternehmen noch ein Freikontingent hinterlegt, wird dieses automatisch eingelöst und es fällt keine Zahlung an.'),
  (1, 'EN',
   'Do I need an account to search for jobs on StuJo?',
   'No. You do not need an account to look for a job. The latest offers are on the home page, and under [Job offers](/stellenangebote) you can filter by category, location/region and occupational field, or search for a keyword or a company.'),
  (2, 'EN',
   'Do I need a company account on StuJo, and does it cost anything?',
   'Yes. To publish a job offer you need an opencampus.sh account – the same account as in EduHub. After signing in, pick the company you want to publish offers for under "Mein StuJo". The account itself is free; costs only arise when you publish a paid ad.'),
  (3, 'EN',
   'Are there any costs for job seekers?',
   'No, searching for a job is free of charge.'),
  (4, 'EN',
   'How much does it cost to post a job ad?',
   'You will find an overview of all services and prices under [For employers](/fuer-arbeitgeber). Mini jobs are free; all prices are net and exclude statutory VAT.'),
  (5, 'EN',
   'Is StuJo only for students?',
   'StuJo focuses on connecting students with companies in their immediate surroundings in Schleswig-Holstein and Hamburg. Thanks to the close contact with the universities in Kiel and Flensburg, jobs at the universities themselves are also advertised regularly.'),
  (6, 'EN',
   'What makes StuJo special?',
   'StuJo is a start-up founded within opencampus.sh by students of Kiel University, with the goal of making the local job search simpler. Today StuJo is run by the non-profit association Campus Business Box e.V. (opencampus.sh) and runs on the same platform as EduHub – so you use the same account everywhere. Through its close contact with local companies and the nearby universities, StuJo is a personal and effective bridge between employers and job seekers.'),
  (7, 'EN',
   'How long are job offers visible?',
   'An offer stays online for 8 weeks (56 days) from publication and then expires automatically. You can shorten that period individually via an earlier application deadline. Expired offers can be re-posted at any time under "Mein StuJo".'),
  (8, 'EN',
   'Where does StuJo''s revenue go?',
   'StuJo''s revenue covers the cost of running and further developing the platform. Any surplus goes to the non-profit association Campus Business Box e.V. (opencampus.sh), which works to sustain a diverse labour market and to promote start-up culture in Schleswig-Holstein.'),
  (9, 'EN',
   'Who posts the job ads?',
   'Employers post their ads themselves, using the online form under "Mein StuJo". StuJo provides the platform and does not act as a placement agency.'),
  (10, 'EN',
   'Can ads be edited after publication?',
   'Yes. Under "Mein StuJo" you can edit your ads at any time – including after they have been published. Changes are visible immediately.'),
  (11, 'EN',
   'Which regions do the job offers come from?',
   'Because of the link with opencampus.sh and the universities in Kiel and Flensburg, the focus is on that area and on Schleswig-Holstein as a whole. Offers from the rest of Germany, from Denmark and from further abroad can be found here too and are very welcome.'),
  (12, 'EN',
   'How do I pay after booking an ad?',
   'Paid ads are charged in advance: when you publish, you are forwarded to our payment provider Stripe and pay there using one of the offered payment methods (e.g. credit card or SEPA direct debit). You receive the invoice electronically as a PDF by e-mail to the address stored in your account, plus a link to the invoice document. If your company still has a free credit available, it is redeemed automatically and no payment is due.')
)
INSERT INTO "public"."FaqTranslation" ("faqId", "lang", "question", "answer")
SELECT numbered.id, content.lang, content.question, content.answer
FROM content
JOIN numbered USING (n);
