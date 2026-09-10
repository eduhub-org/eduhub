# Cutover-Mail an die Arbeitgeber

Fertiger Text für die Ankündigung aus
[`STUJO_PROD_CUTOVER.md` §2.10](./STUJO_PROD_CUTOVER.md) — eine Mail pro
Person, verschickt über `MailLog` / `send_mail`, an alle
`OrganizationAdmin`-Personen mit `canManageJobs`, deren Organisation
mindestens ein Stellenangebot hat. Das ausführbare Statement dazu liegt in
[`../scripts/stujo_cutover_employer_mail.sql`](../scripts/stujo_cutover_employer_mail.sql).

**Wartungsfenster in diesem Entwurf:** Freitag, 11.09.2026, 20:00–24:00 Uhr
**MESZ** (= 18:00–22:00 UTC; der Text nennt bewusst Ortszeit, der Rest des
Cutover-Dokuments rechnet in UTC).

Steht das Fenster anders, sind **vier** Stellen im Text zu ändern — je zwei pro
Datei, plus die Zeile oben. Die `.sql` ist die, die tatsächlich verschickt
wird; dieses Dokument ist die Lesefassung davon, und beide müssen gleich
lauten:

| Datei | Stelle | Enthält den Zeitbezug als |
|---|---|---|
| `scripts/stujo_cutover_employer_mail.sql` | `\set subject …` | Tagesbezug in der Betreffzeile |
| `scripts/stujo_cutover_employer_mail.sql` | `\set body …`, erster `<p>` | Tagesbezug, Wochentag + Datum + Uhrzeit, Tag danach |
| dieses Dokument | Abschnitt „Betreff“ | dieselbe Betreffzeile |
| dieses Dokument | „Text (Lesefassung)“, Absatz 1 | derselbe Wortlaut wie der HTML-Body |

Danach prüfen, dass vom alten Fenster nichts stehen geblieben ist — mit den
alten Formulierungen gesucht, muss die Liste leer sein:

```bash
grep -rn 'morgen Abend\|11\.09\.2026\|Samstagmorgen' \
  docs/STUJO_CUTOVER_EMPLOYER_MAIL.md scripts/stujo_cutover_employer_mail.sql
```

(Die Suchbegriffe sind die des aktuellen Entwurfs; beim Ändern durch die
jeweils ersetzten austauschen.)

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

> StuJo zieht um: morgen Abend kurz offline, danach mit mehr Reichweite

---

## Text (Lesefassung)

Hallo,

StuJo bleibt StuJo – bekommt morgen Abend aber eine neue technische Basis: Die
Plattform zieht auf ein komplett erneuertes System um. Deshalb kannst Du am
Freitag, den 11.09.2026, zwischen 20:00 und 24:00 Uhr keine Stellenangebote
einstellen oder bearbeiten. Deine bereits veröffentlichten Angebote bleiben in
dieser Zeit online und für Studierende sichtbar. Ab Samstagmorgen ist alles wie
gewohnt erreichbar – mit ein paar neuen Möglichkeiten.

**Was gleich bleibt**

- Die Adressen bleiben: stujo.net wie bisher, ebenso die Portale
  (cau.stujo.net, fh-kiel.stujo.net, haw-kiel.stujo.net, flensburg.stujo.net).
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
- **Frische Laufzeit geschenkt.** Alle Angebote, die jetzt online sind,
  starten mit vollen 8 Wochen neu.

**Was Du tun musst:** Nichts. Danach meldest Du Dich wie gewohnt auf stujo.net
an – Deine Angebote findest Du dort unter „Mein StuJo“.

Wenn Du Fragen hast, antworte einfach auf diese E-Mail.

Dein StuJo-Team

---

## Was der Text bewusst nicht sagt

- **Den Vornamen.** `User.firstName` kommt aus `contacts.forname` der
  Rails-Datenbank (`stujo_etl.py`, `sanitize_person_name`) und ist Freitext:
  leer, „Herr“, Firmenname und Tippfehler sind alle möglich. Eine Mail an
  „Hallo GmbH & Co,“ ist schlechter als „Hallo,“ — entschieden gegen die
  Personalisierung.
- **Die Weiterleitungen.** Alte Angebots-Links funktionieren weiter (§4 legacy
  301s), aber neben „die Adressen bleiben gleich“ wirft der Satz mehr Fragen
  auf, als er beantwortet. Es funktioniert — das reicht.
- **Einen Betreiberwechsel.** Es gibt keinen: StuJo gehörte auch vorher zu
  opencampus.sh. Der erste Satz sagt deshalb „neue technische Basis“ und nicht
  „Umzug zu opencampus.sh“; EduHub taucht nur dort auf, wo es wirklich neu ist
  — bei der Reichweite.

- **Alte Rechnungen.** Die Zahlungshistorie bleibt im Rails-Archiv, sie wandert
  nicht mit (§5.1). Wer Belege braucht, merkt es erst, wenn der Server weg ist.
  Falls das vor dem Abschalten kommuniziert werden soll, gehört ein Satz mit
  Frist in die Mail — oder in eine zweite, ruhigere Mail nach dem Umzug.
- **„Passwort vergessen“.** Die bcrypt-Hashes sind importiert, das Passwort
  gilt weiter; wenn die Anmeldung trotzdem hakt, steht der Weg nicht in der
  Mail. Die Zeile „antworte einfach auf diese E-Mail“ fängt das auf, solange
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
