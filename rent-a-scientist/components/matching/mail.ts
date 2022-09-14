export interface MailDescription {
  subject: string;
  content: string;
  to: string;
}

const htmlMailWithContent = (content: string) => {
  return `<!DOCTYPE html>
  <html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="x-apple-disable-message-reformatting">
      <title></title>
      <!--[if mso]>
      <noscript>
          <xml>
              <o:OfficeDocumentSettings>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
          </xml>
      </noscript>
      <![endif]-->
      <style>
          table, td, div, h1, p {font-family: Arial, sans-serif;}
          table, td {border:0px solid #000000 !important;}
      </style>
  </head>
  <body style="margin:0;padding:0;">

      <table role="presentation" style="width:600px;border-collapse:collapse;border:0px solid #cccccc;border-spacing:0;text-align:left;">
          <tr>
              <td style="padding:5px;">
              ${content.replaceAll("\n", "<br/>")}
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;
};

export const createRejectScientist = (
  contactName: string,
  contactMail: string
) => {
  const result: MailDescription = {
    to: contactMail,
    subject: "Rent-a-Scientist Rückmeldung",
    content: htmlMailWithContent(`
Sehr geehrte*r ${contactName},

vielen Dank für Ihre Bereitschaft, im Rahmen von Rent-a-Scientist 2022 eine Schulunterrichtsstunde anzubieten.
Leider müssen wir Ihnen mitteilen, dass Ihr Angebot in diesem Jahr nicht gebucht wurde und Ihre Unterrichtsstunde dementsprechend nicht zu Stande kommt.

Es gab insgesamt ein überwältigendes Feedback aus den Hochschulen und wissenschaftlichen Institutionen. Über 80 Angebote von Wissenschaftler*innen haben uns für Rent-a-Scientist 2022 erreicht, um eine oder sogar mehrere Unterrichtsstunden zu gestalten, weshalb die teilnehmenden Schulen den Luxus einer wirklich großen Auswahl hatten.

Auch wenn es dieses Mal leider nicht geklappt hat, freuen wir uns sehr, wenn Sie im nächsten Jahr wieder dabei sind und sich für Rent-a-Scientist 2023 erneut zur Verfügung stellen.
Sollten Sie noch Fragen oder Feedback haben, sind wir Ihnen für eine Nachricht an fdw@kielregion.de sehr dankbar.

Nochmals vielen Dank & herzliche Grüße
Ihr Rent-a-Scientist Team

KielRegion GmbH 
Wissenschaftspark Kiel 
Neufeldtstraße 6 
24118 Kiel 

E-Mail: fdw@kielregion.de
Web: www.kielregion.de

Aufsichtsratsvorsitzender: Lutz Schlünsen
Geschäftsführerin: Ulrike Schrabback-Wielatt
Amtsgericht Kiel, HRB 10353 KI
Steuernummer: 19 294 31504 Finanzamt Kiel Nord 
Umsatzsteuer Ident Nr. DE 262 929 911

        `),
  };

  return result;
};

export interface ScientistSingleAcceptedInfo {
  postalCode: string;
  city: string;
  street: string;
  schoolName: string;

  day: string;
  grade: number;
  studentsCount: number;

  commentTime: string;
  commentGeneral: string;

  contact: string;
}

export const createAcceptScientist = (
  contactName: string,
  contactMail: string,
  acceptedDays: ScientistSingleAcceptedInfo[]
) => {
  const result: MailDescription = {
    to: contactMail,
    subject: "Rent-a-Scientist Rückmeldung",
    content: htmlMailWithContent(`
Sehr geehrte*r ${contactName},
vielen Dank für Ihre Bereitschaft, im Rahmen von Rent-a-Scientist 2022 eine Schulunterrichtsstunde anzubieten.
Wir freuen uns sehr, Ihnen mitteilen zu können, dass Sie wie folgt angefragt wurden

${acceptedDays
  .map(
    (a) => `

Ort: ${a.postalCode} ${a.city} ${a.street}

Schule: ${a.schoolName}

Tag: ${a.day}

Klassenstufe: ${a.grade}

Kommentar Uhrzeit: ${a.commentTime}

Kommentar: ${a.commentGeneral}

Kontakt: ${a.contact}

    `
  )
  .join("\n\n")}

Die Schule wird sich mit Ihnen in Verbindung setzen, um die weiteren Details abzusprechen. 

Bei Bedarf unterstützen wir Sie gern in Ihren Vorbereitungen.

Aufgrund der überwältigenden positiven Resonanz von Wissenschafts- und Schulseite werden wir Rent-a-Scientist im kommenden Jahr erneut veranstalten. Wir freuen uns sehr, wenn Sie auch dann wieder ein Teil des Projektes sind.

Bitte kontaktieren Sie uns bei generellen Fragen zum Ablauf oder falls ansonsten Unklarheiten oder Bedenken auftreten sehr gerne unter der E-Mail-Adresse fdw@kielregion.de.

Wir danken Ihnen ganz herzlich für Ihr Engagement und wünschen viel Spaß mit Ihrer Unterrichtsstunde.

Mit den besten Grüßen
Ihr Rent-a-Scientist Team


KielRegion GmbH 
Wissenschaftspark Kiel 
Neufeldtstraße 6 
24118 Kiel 

E-Mail: fdw@kielregion.de
Web: www.kielregion.de

Aufsichtsratsvorsitzender: Lutz Schlünsen
Geschäftsführerin: Ulrike Schrabback-Wielatt
Amtsgericht Kiel, HRB 10353 KI
Steuernummer: 19 294 31504 Finanzamt Kiel Nord 
Umsatzsteuer Ident Nr. DE 262 929 911


        `),
  };

  return result;
};

export interface SchoolAcceptedInfo {
  scientist: string;
  contactPhone: string;
  contactEmail: string;
  topic: string;
  day: string;
  time: string;
  className: string;
  classGrade: string;
}

export const createAcceptSchool = (
  contactName: string,
  contactMail: string,
  info: SchoolAcceptedInfo
) => {
  const result: MailDescription = {
    subject: "Rent-a-Scientist Rückmeldung",
    to: contactMail,
    content: htmlMailWithContent(`
Sehr geehrte*r ${contactName},

vielen Dank, dass Sie sich mit der Schulklasse ${info.classGrade}${info.className} im Rahmen von Rent-a-Scientist für den Besuch einer Wissenschaftlerin bzw. eines Wissenschaftlers an Ihrer Schule beworben haben. Wir freuen uns sehr, Ihnen mitteilen zu können, dass wir Ihnen eine Ihrer Wunsch-Unterrichtsstunden für die Woche vom 26.09. bis zum 30.09. bestätigen können:

Wissenschaftler*in: ${info.scientist}

Kontakt Telefon: ${info.contactPhone}
Kontakt E-Mail: ${info.contactEmail}

Thema: ${info.topic}

Tag: ${info.day}

Uhrzeit: ${info.time}

Bitte setzen Sie sich mit Herr*Frau ${info.scientist} in Verbindung, um die Details für die Unterrichtsstunde zu besprechen.

Sollten sich aufgrund des Infektionsgeschehens Veränderungen hinsichtlich des Schulbetriebs ankündigen, informieren Sie uns und den*die Wissenschaftler*in bitte schnellstmöglich.

Kontaktieren Sie uns auch gern bei generellen Fragen zum Ablauf oder falls Unklarheiten oder Bedenken auftreten unter der E-Mail-Adresse fdw@kielregion.de.

Wir wünschen Ihnen, Ihrer Klasse und Ihrem Gast eine hoffentlich spannende und unterhaltsame Unterrichtsstunde.

Mit den besten Grüßen
Ihr Rent-a-Scientist Team

KielRegion GmbH 
Wissenschaftspark Kiel 
Neufeldtstraße 6 
24118 Kiel 

E-Mail: fdw@kielregion.de
Web: www.kielregion.de

Aufsichtsratsvorsitzender: Lutz Schlünsen
Geschäftsführerin: Ulrike Schrabback-Wielatt
Amtsgericht Kiel, HRB 10353 KI
Steuernummer: 19 294 31504 Finanzamt Kiel Nord 
Umsatzsteuer Ident Nr. DE 262 929 911


        `),
  };

  return result;
};

export const createRejectSchool = (
  contactName: string,
  contactMail: string,
  className: string,
  grade: number
) => {
  const result: MailDescription = {
    subject: "Rent-a-Scientist Rückmeldung",
    to: contactMail,
    content: htmlMailWithContent(`
        
Sehr geehrte*r ${contactName},

vielen Dank für Ihre Anfrage im Rahmen unseres Schulprogramms Rent-a-Scientist.

Aufgrund der extrem großen Nachfrage, die uns erreicht hat, müssen wir Ihnen leider mitteilen, dass wir Ihnen keine*n Wissenschaftler*in in der Woche vom 26.09. bis zum 30.09. zuteilen konnten.

Zur Entschädigung möchten wir Ihnen aber anbieten, im Nachgang eine*n Ihrer angefragten Wissenschaftler*innen zu kontaktieren und zu fragen, ob er*sie bereit wäre, einen individuellen Termin mit Ihnen zu vereinbaren. Sollten Sie daran Interesse haben, freuen wir uns über eine kurze Rückmeldung. 

Wir möchten darauf hinweisen, dass einige Angebote von Wissenschaftler*innen über 80 Anfragen erhalten haben. Daher können wir auch im Nachgang leider nicht garantieren, dass Ihre Priorität nicht bereits von einer anderen Lehrkraft angefragt wurde und daher nicht mehr zur Verfügung steht. 

Sollten Sie noch Fragen oder Feedback haben, danken wir Ihnen für eine Nachricht an die E-Mail-Adresse fdw@kielregion.de.

Vielen Dank für Ihre Teilnahme und herzliche Grüße

Ihr Rent-a-Scientist Team


KielRegion GmbH 
Wissenschaftspark Kiel
Neufeldtstraße 6
24118 Kiel
  
E-Mail: fdw@kielregion.de 
Web: www.kielregion.de 
  
Aufsichtsratsvorsitzender: Lutz Schlünsen
Geschäftsführerin: Ulrike Schrabback-Wielatt
Amtsgericht Kiel, HRB 10353 KI 
Steuernummer: 19 294 31504 Finanzamt Kiel Nord 
Umsatzsteuer Ident Nr. DE 262 929 911


        `),
  };

  return result;
};
