# Cutover-Mail an die Arbeitgeber

Fertiger Text für die Ankündigung aus
[`STUJO_PROD_CUTOVER.md` §2.10](./STUJO_PROD_CUTOVER.md) — eine Mail pro
Person, verschickt über `MailLog` / `send_mail`, an alle
`OrganizationAdmin`-Personen mit `canManageJobs`, deren Organisation
mindestens ein Stellenangebot hat. Das ausführbare Statement dazu liegt in
[`../scripts/stujo_cutover_employer_mail.sql`](../scripts/stujo_cutover_employer_mail.sql).

**Wartungsfenster in diesem Entwurf:** Donnerstag, 10.09.2026, 20:00–24:00 Uhr.
Steht das Fenster anders, sind die Zeiten an zwei Stellen zu ändern (Betreff
bleibt gleich): Absatz 1 des Textes hier und Absatz 1 des HTML-Bodys in der
`.sql`.

**Vor dem Versand:**

1. Voller ETL-Lauf durch (die Adressen stehen erst danach in der neuen
   Datenbank) — §3.
2. Mailgun-Schritt §2.2 g abgeschlossen, sonst geht die Mail als
   `noreply@edu.opencampus.sh` statt `team@stujo.net` raus.
3. Empfängerzahl gegen die Rails-Erwartung prüfen (Schritt 1 der `.sql`).
4. Eine Testmail an die eigene Adresse (Schritt 2), danach der Batch
   (Schritt 3).

---

## Betreff

> StuJo zieht um: heute Abend kurz offline, ab morgen mit mehr Reichweite

---

## Text (Lesefassung)

Hallo [Vorname],

StuJo bekommt heute Abend eine neue technische Grundlage – wir ziehen die
Plattform auf das System von opencampus.sh um. Deshalb kannst Du am
Donnerstag, den 10.09.2026, zwischen 20:00 und 24:00 Uhr keine
Stellenangebote einstellen oder bearbeiten. Deine bereits veröffentlichten
Angebote bleiben in dieser Zeit online und für Studierende sichtbar. Ab
Freitagmorgen läuft alles auf der neuen Plattform.

**Was gleich bleibt**

- Die Adresse: stujo.net, wie bisher. Alte Links auf Deine Angebote leiten
  automatisch weiter.
- Dein Zugang: dieselbe E-Mail-Adresse, dasselbe Passwort. Unternehmensdaten,
  Angebote und freie Kontingente sind mitgezogen.
- Die Preise: unverändert. Minijob-Angebote bleiben kostenlos.

**Was neu ist**

- **Deine Stellenangebote auf Deiner eigenen Website.** Als Widget in die
  eigene Karriereseite einbinden – es aktualisiert sich automatisch, sobald Du
  auf StuJo etwas veröffentlichst. Schreib uns kurz, dann schicken wir Dir die
  Details.
- **Mehr Reichweite über EduHub.** Angebote erscheinen jetzt auch auf
  edu.opencampus.sh – der Kursplattform mit über 2.000 Kursbewerbungen pro
  Jahr. Dazu die Hochschulportale (CAU, FH Kiel, HAW Kiel, Flensburg) und neu
  der wöchentliche Job-Letter an Studierende.
- **Bezahlen und Abrechnen geht schneller.** Statt Rechnung per Post und
  Überweisung binnen 30 Tagen: Karte, SEPA-Lastschrift oder Überweisung direkt
  beim Einstellen, Veröffentlichung unmittelbar nach der Zahlung, Rechnung
  automatisch per E-Mail.
- **Frische Laufzeit geschenkt.** Alle heute online stehenden Angebote starten
  mit vollen 8 Wochen neu.

**Was Du tun musst:** Nichts. Ab Freitag meldest Du Dich wie gewohnt auf
stujo.net an – Deine Angebote findest Du dann unter „Mein StuJo".

Wenn Du Fragen hast, antworte einfach auf diese E-Mail.

Dein StuJo-Team

---

## Anrede mit Vornamen

`User.firstName` kommt aus `contacts.forname` der Rails-Datenbank
(`stujo_etl.py`, `sanitize_person_name`) und ist Freitext: leer, „Herr",
Firmenname und Tippfehler sind alle möglich. Das SQL personalisiert deshalb
nur, wenn der Wert wie ein Vorname aussieht (Buchstaben, optional ein
Bindestrich oder ein zweites Wort, 2–30 Zeichen), und schreibt sonst „Hallo,".
Schritt 1 der `.sql` zeigt vorher, wie viele Zeilen in welchen Fall laufen —
sieht die Trefferquote schlecht aus, ist „Hallo," für alle die bessere Wahl
als eine Mail an „Hallo GmbH,".

## Was der Text bewusst nicht sagt

- **Alte Rechnungen.** Die Zahlungshistorie bleibt im Rails-Archiv, sie wandert
  nicht mit (§5.1). Wer Belege braucht, merkt es erst, wenn der Server weg ist.
  Falls das vor dem Abschalten kommuniziert werden soll, gehört ein Satz mit
  Frist in die Mail — oder in eine zweite, ruhigere Mail nach dem Umzug.
- **„Passwort vergessen".** Die bcrypt-Hashes sind importiert, das Passwort
  gilt weiter; wenn die Anmeldung trotzdem hakt, steht der Weg nicht in der
  Mail. Die Zeile „antworte einfach auf diese E-Mail" fängt das auf, solange
  jemand `team@stujo.net` liest.

---

## HTML-Body

Der Body steht in
[`../scripts/stujo_cutover_employer_mail.sql`](../scripts/stujo_cutover_employer_mail.sql)
(dort einzeilig, damit das Statement direkt ausführbar ist). Erlaubt sind nur
`p`, `br`, `strong`, `ul`, `li` und `a` — `sanitizeEmailHtml` in
`EmailEditor.tsx` filtert gegen genau diese Liste, `table` fliegt raus.

Zwei Eigenheiten des Versandwegs, die das Format betreffen:

- `sendMail` setzt denselben String als `text` **und** als `html`
  (`functions/sendMail/index.js`). Wer die Mail als reinen Text liest, sieht
  die Tags. Das gilt für jede EduHub-Mail und wird hier nicht geändert.
- `'o:tracking': true` lässt Mailgun jeden Link umschreiben — deshalb der
  Tracking-CNAME aus §2.2 e, sonst tragen die Links in einer Mail von
  `team@stujo.net` eine Mailgun-Domain.
