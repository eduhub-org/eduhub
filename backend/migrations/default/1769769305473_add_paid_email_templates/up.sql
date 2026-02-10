-- Insert new email template types into MailTemplateType enum
INSERT INTO "public"."MailTemplateType" ("value", "comment") VALUES 
  ('REGISTRATION_CONFIRMED_PAID', 'Sent when a user directly registers for a paid course/event with payment confirmation'),
  ('APPLICATION_RECEIVED_PAID', 'Sent when a user applies for a paid course with upfront payment')
ON CONFLICT ("value") DO NOTHING;

-- Insert new email templates for paid course registrations and applications
-- These templates include payment details, add-ons, and full AGB text inline

INSERT INTO "public"."MailTemplate"("type", "courseId", "subject", "content", "from", "cc", "bcc", "created_at", "updated_at") VALUES 
(
  'REGISTRATION_CONFIRMED_PAID',
  NULL,
  'Bestätigung deiner Buchung auf EduHub',
  '<!DOCTYPE html>
<html>
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  </head>
  <body>
    <p>Hallo [User:Firstname],</p>
    <p>vielen Dank für deine Anmeldung über EduHub.</p>
    <p>Hiermit bestätigen wir deine Buchung für folgendes Angebot:</p>
    <p><strong>Deine Buchung:</strong></p>
    <p>– [Enrollment:CourseId--Course:Name]<br />
    Teilnahmegebühr: [Course:BasePrice] € inkl. MwSt.</p>
    <p>[Enrollment:Addons]</p>
    <p><strong>Gesamtbetrag: [Enrollment:TotalCost] € inkl. MwSt.</strong></p>
    <p>Datum: [Course:StartTime] - [Course:EndTime]<br />
    Veranstalter: Campus Business Box e.V.</p>
    <p>Die Zahlung wurde erfolgreich über den gewählten Zahlungsdienstleister abgewickelt.</p>
    <hr />
    <p><strong>Allgemeine Geschäftsbedingungen (AGB)</strong></p>
    <h2>§ 1 Geltungsbereich</h2>
    <p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen dem Campus Business Box e.V. (nachfolgend „Anbieter") und Verbraucher:innen (§ 13 BGB) über kostenpflichtige Bildungs- und Veranstaltungsangebote (z. B. Kurse, Workshops, Events), die über die Plattform EduHub angeboten werden.</p>
    <p>Das Angebot richtet sich ausschließlich an Verbraucher.</p>
    <h2>§ 2 Vertragsgegenstand</h2>
    <p>Vertragsgegenstand ist die Teilnahme an dem jeweils gebuchten Angebot gemäß der Leistungsbeschreibung auf der Plattform.</p>
    <p>Digitale Downloads oder On-Demand-Inhalte sind nicht Bestandteil der Leistungen.</p>
    <h2>§ 3 Vertragsschluss</h2>
    <p>Die Darstellung der Angebote stellt kein rechtlich bindendes Angebot dar.</p>
    <p>Einige Angebote auf der Plattform sind bewerbungspflichtig. Das bedeutet, dass vor der Teilnahme eine Bewerbung erforderlich ist und die Auswahl der Teilnehmenden durch den Anbieter erfolgt.</p>
    <p>Bei nicht bewerbungspflichtigen Angeboten kommt der Vertrag zustande, sobald der Buchungsprozess abgeschlossen und die Zahlung erfolgreich ausgelöst wurde.</p>
    <p>Bei bewerbungspflichtigen Angeboten erfolgt zunächst eine Bewerbung. Der Vertrag kommt erst mit ausdrücklicher Teilnahmebestätigung durch den Anbieter zustande.</p>
    <p>Nach Vertragsschluss erhält der/die Teilnehmende eine Bestätigungs-E-Mail mit allen Vertragsinformationen sowie diesen AGB in Textform.</p>
    <h2>§ 4 Preise und Zahlungsbedingungen</h2>
    <p>Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.</p>
    <p>Die Zahlung ist unmittelbar mit Vertragsschluss fällig.</p>
    <p>Die Zahlungsabwicklung erfolgt über externe Zahlungsdienstleister (z. B. Stripe).</p>
    <p>Bei bewerbungspflichtigen, kostenpflichtigen Angeboten kann die Teilnahmegebühr bereits im Rahmen der Bewerbung erhoben werden.</p>
    <p>Wird die Bewerbung nicht berücksichtigt, wird die bereits gezahlte Gebühr vollständig und unverzüglich auf das ursprünglich verwendete Zahlungsmittel zurückerstattet.</p>
    <h2>§ 5 Zahlungsabwicklung & Drittanbieter</h2>
    <p>Die Erhebung von Registrierungs- und Bewerbungsdaten erfolgt über Formulare, die innerhalb der Plattform EduHub bereitgestellt werden. Hierfür wird das Tool „Formbricks" als technischer Dienstleister eingesetzt.</p>
    <p>Zahlungsdaten werden ausschließlich über zertifizierte Zahlungsdienstleister (z. B. Stripe) verarbeitet.</p>
    <p>Der Anbieter hat keinen Zugriff auf vollständige Zahlungsdaten (z. B. Kreditkartennummern).</p>
    <p>Weitere Informationen finden sich in der Datenschutzerklärung.</p>
    <h2>§ 6 Widerrufsrecht</h2>
    <p>Verbraucher:innen haben ein gesetzliches Widerrufsrecht von 14 Tagen.</p>
    <p><strong>Widerrufsbelehrung:</strong></p>
    <p>Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beginnt mit dem Tag des Vertragsschlusses.</p>
    <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Campus Business Box e.V., Fraunhoferstraße 13, 24118 Kiel, E-Mail: edu@opencampus.sh) mittels einer eindeutigen Erklärung (z. B. per E-Mail) informieren.</p>
    <p><strong>Erlöschen des Widerrufsrechts:</strong></p>
    <p>Das Widerrufsrecht erlischt vorzeitig, wenn die Veranstaltung vollständig durchgeführt wurde oder wenn Sie ausdrücklich zugestimmt haben, dass der Anbieter vor Ablauf der Widerrufsfrist mit der Leistung beginnt.</p>
    <h2>§ 7 Stornierung</h2>
    <p>Eine kostenfreie Stornierung ist bis 14 Tage vor Beginn des Angebots möglich.</p>
    <p>Bei späterer Stornierung besteht kein Anspruch auf Rückerstattung, es sei denn, es liegt ein wichtiger Grund vor (z. B. Krankheit).</p>
    <p>Bei Absage durch den Anbieter wird die Teilnahmegebühr vollständig erstattet.</p>
    <h2>§ 8 Teilnahme & Ausschluss</h2>
    <p>Teilnehmende sind verpflichtet, die organisatorischen Hinweise zu beachten und sich respektvoll zu verhalten.</p>
    <p>Bei schwerwiegenden Verstößen kann ein Ausschluss erfolgen. Ein Anspruch auf Rückerstattung besteht in diesem Fall nicht.</p>
    <h2>§ 9 Haftung</h2>
    <p>Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.</p>
    <p>Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren Schaden.</p>
    <h2>§ 10 Datenschutz</h2>
    <p>Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung, die integraler Bestandteil dieses Vertrags ist.</p>
    <h2>§ 11 Schlussbestimmungen</h2>
    <p>Es gilt deutsches Recht.</p>
    <p>Gerichtsstand ist Kiel, soweit gesetzlich zulässig.</p>
    <p>Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.</p>
    <hr />
    <p>Datenschutzerklärung: https://edu.opencampus.sh/privacy</p>
    <hr />
    <p>Bei Rückfragen erreichst du uns jederzeit unter: edu@opencampus.sh</p>
    <p>Viele Grüße<br />Dein EduHub-Team</p>
  </body>
</html>',
  'noreply@opencampus.sh',
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  'APPLICATION_RECEIVED_PAID',
  NULL,
  'Deine Bewerbung auf EduHub - Zahlung eingegangen',
  '<!DOCTYPE html>
<html>
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  </head>
  <body>
    <p>Hallo [User:Firstname],</p>
    <p>vielen Dank für deine Bewerbung über EduHub.</p>
    <p>Wir haben deine Bewerbung für folgendes Angebot erhalten:</p>
    <p><strong>Deine Bewerbung umfasst:</strong></p>
    <p>– [Enrollment:CourseId--Course:Name]<br />
    Teilnahmegebühr: [Course:BasePrice] € inkl. MwSt.</p>
    <p>[Enrollment:Addons]</p>
    <p><strong>Gesamtbetrag: [Enrollment:TotalCost] € inkl. MwSt.</strong></p>
    <p>Die Zahlung wurde erfolgreich entgegengenommen.</p>
    <p><strong>Wichtiger Hinweis:</strong><br />
    Die Teilnahme kommt erst mit einer gesonderten Bestätigung zustande.<br />
    Bei Nichtberücksichtigung werden alle gezahlten Beträge vollständig und unverzüglich auf das ursprünglich verwendete Zahlungsmittel erstattet.</p>
    <p>Du erhältst eine weitere E-Mail, sobald über deine Bewerbung entschieden wurde.</p>
    <hr />
    <p><strong>Allgemeine Geschäftsbedingungen (AGB)</strong></p>
    <h2>§ 1 Geltungsbereich</h2>
    <p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen dem Campus Business Box e.V. (nachfolgend „Anbieter") und Verbraucher:innen (§ 13 BGB) über kostenpflichtige Bildungs- und Veranstaltungsangebote (z. B. Kurse, Workshops, Events), die über die Plattform EduHub angeboten werden.</p>
    <p>Das Angebot richtet sich ausschließlich an Verbraucher.</p>
    <h2>§ 2 Vertragsgegenstand</h2>
    <p>Vertragsgegenstand ist die Teilnahme an dem jeweils gebuchten Angebot gemäß der Leistungsbeschreibung auf der Plattform.</p>
    <p>Digitale Downloads oder On-Demand-Inhalte sind nicht Bestandteil der Leistungen.</p>
    <h2>§ 3 Vertragsschluss</h2>
    <p>Die Darstellung der Angebote stellt kein rechtlich bindendes Angebot dar.</p>
    <p>Einige Angebote auf der Plattform sind bewerbungspflichtig. Das bedeutet, dass vor der Teilnahme eine Bewerbung erforderlich ist und die Auswahl der Teilnehmenden durch den Anbieter erfolgt.</p>
    <p>Bei nicht bewerbungspflichtigen Angeboten kommt der Vertrag zustande, sobald der Buchungsprozess abgeschlossen und die Zahlung erfolgreich ausgelöst wurde.</p>
    <p>Bei bewerbungspflichtigen Angeboten erfolgt zunächst eine Bewerbung. Der Vertrag kommt erst mit ausdrücklicher Teilnahmebestätigung durch den Anbieter zustande.</p>
    <p>Nach Vertragsschluss erhält der/die Teilnehmende eine Bestätigungs-E-Mail mit allen Vertragsinformationen sowie diesen AGB in Textform.</p>
    <h2>§ 4 Preise und Zahlungsbedingungen</h2>
    <p>Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.</p>
    <p>Die Zahlung ist unmittelbar mit Vertragsschluss fällig.</p>
    <p>Die Zahlungsabwicklung erfolgt über externe Zahlungsdienstleister (z. B. Stripe).</p>
    <p>Bei bewerbungspflichtigen, kostenpflichtigen Angeboten kann die Teilnahmegebühr bereits im Rahmen der Bewerbung erhoben werden.</p>
    <p>Wird die Bewerbung nicht berücksichtigt, wird die bereits gezahlte Gebühr vollständig und unverzüglich auf das ursprünglich verwendete Zahlungsmittel zurückerstattet.</p>
    <h2>§ 5 Zahlungsabwicklung & Drittanbieter</h2>
    <p>Die Erhebung von Registrierungs- und Bewerbungsdaten erfolgt über Formulare, die innerhalb der Plattform EduHub bereitgestellt werden. Hierfür wird das Tool „Formbricks" als technischer Dienstleister eingesetzt.</p>
    <p>Zahlungsdaten werden ausschließlich über zertifizierte Zahlungsdienstleister (z. B. Stripe) verarbeitet.</p>
    <p>Der Anbieter hat keinen Zugriff auf vollständige Zahlungsdaten (z. B. Kreditkartennummern).</p>
    <p>Weitere Informationen finden sich in der Datenschutzerklärung.</p>
    <h2>§ 6 Widerrufsrecht</h2>
    <p>Verbraucher:innen haben ein gesetzliches Widerrufsrecht von 14 Tagen.</p>
    <p><strong>Widerrufsbelehrung:</strong></p>
    <p>Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beginnt mit dem Tag des Vertragsschlusses.</p>
    <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Campus Business Box e.V., Fraunhoferstraße 13, 24118 Kiel, E-Mail: edu@opencampus.sh) mittels einer eindeutigen Erklärung (z. B. per E-Mail) informieren.</p>
    <p><strong>Erlöschen des Widerrufsrechts:</strong></p>
    <p>Das Widerrufsrecht erlischt vorzeitig, wenn die Veranstaltung vollständig durchgeführt wurde oder wenn Sie ausdrücklich zugestimmt haben, dass der Anbieter vor Ablauf der Widerrufsfrist mit der Leistung beginnt.</p>
    <h2>§ 7 Stornierung</h2>
    <p>Eine kostenfreie Stornierung ist bis 14 Tage vor Beginn des Angebots möglich.</p>
    <p>Bei späterer Stornierung besteht kein Anspruch auf Rückerstattung, es sei denn, es liegt ein wichtiger Grund vor (z. B. Krankheit).</p>
    <p>Bei Absage durch den Anbieter wird die Teilnahmegebühr vollständig erstattet.</p>
    <h2>§ 8 Teilnahme & Ausschluss</h2>
    <p>Teilnehmende sind verpflichtet, die organisatorischen Hinweise zu beachten und sich respektvoll zu verhalten.</p>
    <p>Bei schwerwiegenden Verstößen kann ein Ausschluss erfolgen. Ein Anspruch auf Rückerstattung besteht in diesem Fall nicht.</p>
    <h2>§ 9 Haftung</h2>
    <p>Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.</p>
    <p>Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren Schaden.</p>
    <h2>§ 10 Datenschutz</h2>
    <p>Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung, die integraler Bestandteil dieses Vertrags ist.</p>
    <h2>§ 11 Schlussbestimmungen</h2>
    <p>Es gilt deutsches Recht.</p>
    <p>Gerichtsstand ist Kiel, soweit gesetzlich zulässig.</p>
    <p>Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.</p>
    <hr />
    <p>Datenschutzerklärung: https://edu.opencampus.sh/privacy</p>
    <hr />
    <p>Bei Rückfragen erreichst du uns jederzeit unter: edu@opencampus.sh</p>
    <p>Viele Grüße<br />Dein EduHub-Team</p>
  </body>
</html>',
  'noreply@opencampus.sh',
  NULL,
  NULL,
  NOW(),
  NOW()
) 
ON CONFLICT ("type") WHERE "courseId" IS NULL DO NOTHING;
