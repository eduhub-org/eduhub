-- StuJo cutover announcement to the employers.
--
-- Companion to docs/STUJO_CUTOVER_EMPLOYER_MAIL.md and §2.10 of
-- docs/STUJO_PROD_CUTOVER.md. Run it against the PRODUCTION database, after
-- the full ETL run and after Mailgun step §2.2 g — before that, the mail
-- leaves as noreply@edu.opencampus.sh instead of team@stujo.net.
--
-- The insert IS the send: the send_mail event trigger on MailLog fires per
-- inserted row (insert, columns '*') and neither the trigger nor
-- functions/sendMail looks at "status" or "scheduledAt". The one safety net is
-- the transaction — Hasura writes its event rows inside it, so a ROLLBACK
-- before COMMIT unqueues everything. There is no way back after COMMIT.
--
--   psql "$PROD_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/stujo_cutover_employer_mail.sql
--
-- Step 2 sends one mail — to you. Step 3, the real batch, ends in ROLLBACK on
-- purpose: read the counts it prints, then change that one word to COMMIT and
-- run the file again.

\set batch 250
\set test_recipient 'login@opencampus.sh'
\set subject 'StuJo zieht um: heute Abend kurz offline, ab morgen mit mehr Reichweite'

-- The body, minus the greeting line, which is prepended in steps 2 and 3.
-- Only p/br/strong/ul/li/a — sanitizeEmailHtml (EmailEditor.tsx) drops the
-- rest, and <table> in particular.
\set body '<p>StuJo bleibt StuJo – bekommt heute Abend aber eine neue technische Basis: Die Plattform zieht auf ein komplett erneuertes System um. Deshalb kannst Du am <strong>Donnerstag, den 10.09.2026, zwischen 20:00 und 24:00 Uhr</strong> keine Stellenangebote einstellen oder bearbeiten. Deine bereits veröffentlichten Angebote bleiben in dieser Zeit online und für Studierende sichtbar. Ab Freitagmorgen ist alles wie gewohnt erreichbar – mit ein paar neuen Möglichkeiten.</p><p><strong>Was gleich bleibt</strong></p><ul><li>Die Adresse: <a href="https://stujo.net">stujo.net</a>, wie bisher. Alte Links auf Deine Angebote leiten automatisch weiter.</li><li>Dein Zugang: dieselbe E-Mail-Adresse, dasselbe Passwort. Unternehmensdaten, Angebote und freie Kontingente sind mitgezogen.</li><li>Die Preise: unverändert. Minijob-Angebote bleiben kostenlos.</li></ul><p><strong>Was neu ist</strong></p><ul><li><strong>Deine Stellenangebote auf Deiner eigenen Website.</strong> Als Widget in die eigene Karriereseite einbinden – es aktualisiert sich automatisch, sobald Du auf StuJo etwas veröffentlichst. Schreib uns kurz, dann schicken wir Dir die Details.</li><li><strong>Mehr Reichweite über EduHub.</strong> Angebote erscheinen jetzt auch auf <a href="https://edu.opencampus.sh">edu.opencampus.sh</a> – der Kursplattform mit über 2.000 Kursbewerbungen pro Jahr. Dazu die Hochschulportale (CAU, FH Kiel, HAW Kiel, Flensburg) und neu der wöchentliche Job-Letter an Studierende.</li><li><strong>Bezahlen und Abrechnen geht schneller.</strong> Statt Rechnung per Post und Überweisung binnen 30 Tagen: Karte, SEPA-Lastschrift oder Überweisung direkt beim Einstellen, Veröffentlichung unmittelbar nach der Zahlung, Rechnung automatisch per E-Mail.</li><li><strong>Frische Laufzeit geschenkt.</strong> Alle heute online stehenden Angebote starten mit vollen 8 Wochen neu.</li></ul><p><strong>Was Du tun musst:</strong> Nichts. Ab Freitag meldest Du Dich wie gewohnt auf <a href="https://stujo.net">stujo.net</a> an – Deine Angebote findest Du dann unter „Mein StuJo".</p><p>Wenn Du Fragen hast, antworte einfach auf diese E-Mail.</p><p>Dein StuJo-Team</p>'


-- ---------------------------------------------------------------------------
-- Step 1 — who this reaches
-- ---------------------------------------------------------------------------
-- "has at least one job posting in any status": an employer whose posting
-- expired years ago still had an account here and still needs telling.
-- Check the total against what Rails says before going any further.

CREATE OR REPLACE VIEW pg_temp.cutover_recipients AS
SELECT DISTINCT ON (u."email")
  u."id"    AS user_id,
  u."email" AS email
-- No first name in the greeting: User.firstName is Rails contacts.forname and
-- is free text, so "Herr", a company name and an empty string all occur.
-- Everybody gets "Hallo,".
FROM "public"."OrganizationAdmin" oa
JOIN "public"."User" u ON u."id" = oa."userId"
WHERE oa."canManageJobs"
  AND EXISTS (SELECT 1 FROM "public"."JobPosting" jp WHERE jp."organizationId" = oa."organizationId")
  AND u."email" IS NOT NULL
  AND u."email" <> ''
ORDER BY u."email", u."id";

SELECT count(*) AS empfaenger FROM pg_temp.cutover_recipients;


-- ---------------------------------------------------------------------------
-- Step 2 — one mail to yourself first
-- ---------------------------------------------------------------------------
-- Confirm it arrives, renders, and comes from team@stujo.net. The metadata key
-- is deliberately NOT the announcement one, so this row does not make the real
-- send skip your address later.

BEGIN;
INSERT INTO "public"."MailLog" ("subject", "content", "from", "to", "status", "metadata")
SELECT
  :'subject',
  '<p>Hallo,</p>' || :'body',
  'team@stujo.net',
  :'test_recipient',
  'READY_TO_SEND',
  '{"announcement": "stujo-cutover-test"}'::jsonb
-- Guarded, so running the file a second time (to COMMIT step 3) does not send
-- you the test mail again.
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MailLog" m
  WHERE m."to" = :'test_recipient'
    AND m."metadata" @> '{"announcement": "stujo-cutover-test"}'::jsonb
);
COMMIT;


-- ---------------------------------------------------------------------------
-- Step 3 — the batch
-- ---------------------------------------------------------------------------
-- Safe to run repeatedly: DISTINCT ON (step 1) gives one row per address, and
-- the NOT EXISTS guard skips anybody a previous batch already reached. Run it
-- as often as the count says rows are left.
--
-- The metadata key is "announcement", deliberately not "jobPostingId": the
-- partial unique index MailLog_job_posting_mail_unique constrains rows
-- carrying that key and would reject the batch.

BEGIN;

INSERT INTO "public"."MailLog" ("subject", "content", "from", "to", "status", "metadata")
SELECT
  :'subject',
  '<p>Hallo,</p>' || :'body',
  'team@stujo.net',
  r.email,
  'READY_TO_SEND',
  '{"announcement": "stujo-cutover"}'::jsonb
FROM pg_temp.cutover_recipients r
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MailLog" m
  WHERE m."to" = r.email
    AND m."metadata" @> '{"announcement": "stujo-cutover"}'::jsonb
)
LIMIT :batch;

-- How many are queued now, and how many are still waiting for the next run.
SELECT (SELECT count(*) FROM "public"."MailLog"
        WHERE "metadata" @> '{"announcement": "stujo-cutover"}'::jsonb) AS eingefuegt_gesamt,
       (SELECT count(*) FROM pg_temp.cutover_recipients r
        WHERE NOT EXISTS (SELECT 1 FROM "public"."MailLog" m
                          WHERE m."to" = r.email
                            AND m."metadata" @> '{"announcement": "stujo-cutover"}'::jsonb)) AS noch_offen;

-- Read those two numbers. Then change ROLLBACK to COMMIT and run again —
-- nothing has left the building until you do.
ROLLBACK;


-- ---------------------------------------------------------------------------
-- After the send
-- ---------------------------------------------------------------------------
-- Mailgun's log after an hour: hard bounces are the employers whose address
-- died with the old platform, and nothing in this repo retries them (§2.10 d).
--
--   SELECT "to", "status", "created_at" FROM "public"."MailLog"
--   WHERE "metadata" @> '{"announcement": "stujo-cutover"}'::jsonb
--   ORDER BY "created_at" DESC LIMIT 20;
