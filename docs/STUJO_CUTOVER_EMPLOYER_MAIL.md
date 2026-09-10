# Cutover-Mail an die Arbeitgeber

Fertiger Text für die Ankündigung aus
[`STUJO_PROD_CUTOVER.md` §2.10](./STUJO_PROD_CUTOVER.md) — eine Mail pro
Person, verschickt über `MailLog` / `send_mail`, an alle
`OrganizationAdmin`-Personen mit `canManageJobs`, deren Organisation
mindestens ein Stellenangebot hat.

**Wartungsfenster in diesem Entwurf:** Donnerstag, 10.09.2026, 20:00–24:00 Uhr.
Steht das Fenster anders, sind die Zeiten an drei Stellen zu ändern (Betreff
bleibt gleich): Absatz 1 des Textes, Absatz 1 des HTML-Bodys, und die
Stichzeile „ab Freitagmorgen".

**Vor dem Versand:**

1. Voller ETL-Lauf durch (die Adressen stehen erst danach in der neuen
   Datenbank) — §3.
2. Mailgun-Schritt §2.2 g abgeschlossen, sonst geht die Mail als
   `noreply@edu.opencampus.sh` statt `team@stujo.net` raus.
3. Empfängerzahl gegen die Rails-Erwartung prüfen (§2.10 a).
4. Eine Testmail an die eigene Adresse (§2.10 b), danach der Batch (§2.10 c).

---

## Betreff

> StuJo zieht um: heute Abend kurz offline, ab morgen mit mehr Reichweite

Kürzere Alternative, falls der Betreff in der Vorschau abgeschnitten wird:

> StuJo zieht um: was sich für Dich ändert

---

## Text (Lesefassung)

Hallo,

StuJo bekommt heute Abend eine neue technische Grundlage: Wir ziehen die
Plattform auf das System von opencampus.sh um. **Am Donnerstag, den
10.09.2026, zwischen 20:00 und 24:00 Uhr** kannst Du deshalb keine
Stellenangebote einstellen oder bearbeiten. Deine bereits veröffentlichten
Angebote bleiben in dieser Zeit online und für Studierende sichtbar. Ab
Freitagmorgen läuft alles auf der neuen Plattform.

**Was gleich bleibt**

- Die Adresse: stujo.net, wie bisher. Alte Links auf Deine Angebote leiten
  automatisch weiter.
- Dein Zugang: dieselbe E-Mail-Adresse, dasselbe Passwort. Deine
  Unternehmensdaten, Deine Angebote und Deine freien Kontingente sind
  mitgezogen.
- Die Preise: unverändert. Minijob-Angebote bleiben kostenlos.

**Was neu ist**

- **Deine Stellenangebote auf Deiner eigenen Website.** Du kannst Deine
  aktuellen Angebote als Widget in Deine Karriereseite einbinden — ein
  Zeilen-Schnipsel, der sich automatisch aktualisiert, sobald Du auf StuJo
  etwas veröffentlichst. Dasselbe gibt es für die Kurse und Projekte von
  opencampus.sh, falls Du mit uns zusammenarbeitest. Schreib uns kurz, dann
  richten wir Dir den Zugang dafür ein.
- **Mehr Reichweite über EduHub.** Deine Angebote erscheinen jetzt auch auf
  edu.opencampus.sh — der Kursplattform, auf der sich jedes Jahr über 2.000
  Mal Studierende für Kurse bewerben. Dazu kommen wie bisher die
  Hochschulportale (CAU, FH Kiel, HAW Kiel, Europa-Universität Flensburg) und
  neu der wöchentliche Job-Letter, der Studierende montags über passende neue
  Angebote informiert.
- **Bezahlen und Abrechnen geht schneller.** Statt Rechnung per Post und
  Überweisung innerhalb von 30 Tagen zahlst Du direkt beim Einstellen — per
  Karte, SEPA-Lastschrift oder Überweisung. Dein Angebot ist unmittelbar nach
  der Zahlung online, die Rechnung kommt automatisch per E-Mail.
- **Ein eigener Bereich „Mein StuJo".** Angebote als Entwurf speichern und
  vorher in der Vorschau ansehen, abgelaufene Angebote mit zwei Klicks erneut
  veröffentlichen, sehen wie oft ein Angebot aufgerufen wurde, und Kolleginnen
  und Kollegen Zugriff auf Euer Unternehmensprofil geben.
- **Frische Laufzeit geschenkt.** Alle Angebote, die heute online sind,
  starten auf der neuen Plattform mit vollen 8 Wochen Laufzeit neu.

**Was Du tun musst**

Nichts. Melde Dich ab Freitag einfach wie gewohnt auf stujo.net an; „Mein
StuJo" findest Du oben im Menü. Falls die Anmeldung hakt, hilft
„Passwort vergessen" — und wenn nicht, schreib uns.

Ein Hinweis noch: Rechnungen und Belege aus der alten Plattform ziehen wir
nicht mit um. Wenn Du davon noch etwas brauchst, sag uns bitte innerhalb der
nächsten vier Wochen Bescheid, dann suchen wir es aus dem Archiv heraus.

Antworten auf diese Mail landen bei uns — auf team@stujo.net liest ein Mensch
mit. Wir freuen uns, wenn Du auch auf der neuen Plattform Studierende für Dich
gewinnst.

Viele Grüße
Dein StuJo-Team

---

## HTML-Body (für `MailLog.content`)

Nur `p`, `ul`, `li`, `strong` und `a` — der Editor sanitizet gegen genau diese
Liste, `table` würde entfernt (§2.10 b).

```html
<p>Hallo,</p>
<p>StuJo bekommt heute Abend eine neue technische Grundlage: Wir ziehen die Plattform auf das System von opencampus.sh um. <strong>Am Donnerstag, den 10.09.2026, zwischen 20:00 und 24:00 Uhr</strong> kannst Du deshalb keine Stellenangebote einstellen oder bearbeiten. Deine bereits veröffentlichten Angebote bleiben in dieser Zeit online und für Studierende sichtbar. Ab Freitagmorgen läuft alles auf der neuen Plattform.</p>
<p><strong>Was gleich bleibt</strong></p>
<ul>
<li>Die Adresse: <a href="https://stujo.net">stujo.net</a>, wie bisher. Alte Links auf Deine Angebote leiten automatisch weiter.</li>
<li>Dein Zugang: dieselbe E-Mail-Adresse, dasselbe Passwort. Deine Unternehmensdaten, Deine Angebote und Deine freien Kontingente sind mitgezogen.</li>
<li>Die Preise: unverändert. Minijob-Angebote bleiben kostenlos.</li>
</ul>
<p><strong>Was neu ist</strong></p>
<ul>
<li><strong>Deine Stellenangebote auf Deiner eigenen Website.</strong> Du kannst Deine aktuellen Angebote als Widget in Deine Karriereseite einbinden &ndash; ein Zeilen-Schnipsel, der sich automatisch aktualisiert, sobald Du auf StuJo etwas ver&ouml;ffentlichst. Dasselbe gibt es f&uuml;r die Kurse und Projekte von opencampus.sh, falls Du mit uns zusammenarbeitest. Schreib uns kurz, dann richten wir Dir den Zugang daf&uuml;r ein.</li>
<li><strong>Mehr Reichweite &uuml;ber EduHub.</strong> Deine Angebote erscheinen jetzt auch auf <a href="https://edu.opencampus.sh">edu.opencampus.sh</a> &ndash; der Kursplattform, auf der sich jedes Jahr &uuml;ber 2.000 Mal Studierende f&uuml;r Kurse bewerben. Dazu kommen wie bisher die Hochschulportale (CAU, FH Kiel, HAW Kiel, Europa-Universit&auml;t Flensburg) und neu der w&ouml;chentliche Job-Letter, der Studierende montags &uuml;ber passende neue Angebote informiert.</li>
<li><strong>Bezahlen und Abrechnen geht schneller.</strong> Statt Rechnung per Post und &Uuml;berweisung innerhalb von 30 Tagen zahlst Du direkt beim Einstellen &ndash; per Karte, SEPA-Lastschrift oder &Uuml;berweisung. Dein Angebot ist unmittelbar nach der Zahlung online, die Rechnung kommt automatisch per E-Mail.</li>
<li><strong>Ein eigener Bereich &bdquo;Mein StuJo&ldquo;.</strong> Angebote als Entwurf speichern und vorher in der Vorschau ansehen, abgelaufene Angebote mit zwei Klicks erneut ver&ouml;ffentlichen, sehen wie oft ein Angebot aufgerufen wurde, und Kolleginnen und Kollegen Zugriff auf Euer Unternehmensprofil geben.</li>
<li><strong>Frische Laufzeit geschenkt.</strong> Alle Angebote, die heute online sind, starten auf der neuen Plattform mit vollen 8 Wochen Laufzeit neu.</li>
</ul>
<p><strong>Was Du tun musst</strong></p>
<p>Nichts. Melde Dich ab Freitag einfach wie gewohnt auf <a href="https://stujo.net">stujo.net</a> an; &bdquo;Mein StuJo&ldquo; findest Du oben im Men&uuml;. Falls die Anmeldung hakt, hilft &bdquo;Passwort vergessen&ldquo; &ndash; und wenn nicht, schreib uns.</p>
<p>Ein Hinweis noch: Rechnungen und Belege aus der alten Plattform ziehen wir nicht mit um. Wenn Du davon noch etwas brauchst, sag uns bitte innerhalb der n&auml;chsten vier Wochen Bescheid, dann suchen wir es aus dem Archiv heraus.</p>
<p>Antworten auf diese Mail landen bei uns &ndash; auf <a href="mailto:team@stujo.net">team@stujo.net</a> liest ein Mensch mit. Wir freuen uns, wenn Du auch auf der neuen Plattform Studierende f&uuml;r Dich gewinnst.</p>
<p>Viele Gr&uuml;&szlig;e<br>Dein StuJo-Team</p>
```

---

## Versand

Die Testmail an sich selbst zuerst (§2.10 b), dann der Batch. Das Statement ist
das aus §2.10 c, mit eingesetztem Betreff; `DISTINCT ON` und der
`NOT EXISTS`-Guard machen es zweimal ausführbar, das `announcement`-Metadatum
ist bewusst nicht `jobPostingId` (sonst greift der partielle Unique-Index).
`$$…$$` als Quoting, weil der Body Apostrophe in Attributen enthält.

```sql
BEGIN;

INSERT INTO "public"."MailLog" ("subject", "content", "from", "to", "status", "metadata")
SELECT DISTINCT ON (u."email")
  'StuJo zieht um: heute Abend kurz offline, ab morgen mit mehr Reichweite',
  $$<p>Hallo,</p> … <!-- HTML-Body von oben, in einer Zeile --> $$,
  'team@stujo.net',
  u."email",
  'READY_TO_SEND',
  '{"announcement": "stujo-cutover"}'::jsonb
FROM "public"."OrganizationAdmin" oa
JOIN "public"."User" u ON u."id" = oa."userId"
WHERE oa."canManageJobs"
  AND EXISTS (SELECT 1 FROM "public"."JobPosting" jp WHERE jp."organizationId" = oa."organizationId")
  AND NOT EXISTS (
    SELECT 1 FROM "public"."MailLog" m
    WHERE m."to" = u."email" AND m."metadata" @> '{"announcement": "stujo-cutover"}'::jsonb
  );

-- Zeilenzahl gegen die Erwartung aus §2.10 a prüfen, erst dann:
COMMIT;
```

Nach einer Stunde das Mailgun-Log auf Bounces ansehen (§2.10 d) — harte
Bounces werden nirgends nachverfolgt und sind manuelle Nacharbeit.
