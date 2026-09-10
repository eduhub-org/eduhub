import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';

import { useRoleQuery } from '../../hooks/authedQuery';
import { GUEST_DATA_RETENTION_MONTHS } from '../../queries/guestRegistration';
import { GuestDataRetentionMonths } from '../../queries/__generated__/GuestDataRetentionMonths';
import { AuthRoles } from '../../types/enums';

/**
 * The privacy policy, as composable sections shared by the edu-hub and StuJo
 * apps (StuJo reaches them through the `@eduhub/*` alias).
 *
 * Both sites are run by Campus Business Box e.V. and share this wording, but
 * they do NOT do the same things: StuJo loads no Cookiebot, Plausible, Meta
 * Pixel or Formbricks and has no courses, guest registrations or newsletter,
 * while only StuJo publishes job postings. A single rendered document would
 * therefore have to claim processing that does not happen on one of the two
 * domains. Each page instead composes the sections that apply to it and passes
 * its own section number -- see `pages/privacy/index.tsx` here and
 * `apps/stujo/pages/datenschutz.tsx`.
 *
 * Consequences for anyone editing this file:
 *
 *   - Never cross-reference a section by NUMBER. The numbers differ per app.
 *     Name the section instead.
 *   - Colours must come from the `--eduhub-*` token classes
 *     (`text-label-primary`, `text-label-secondary`). StuJo redefines those
 *     tokens to dark-on-light in its own `globals.css`; a literal `text-white`
 *     would be invisible there.
 *   - The whole document lives in this one file on purpose. Consent recorded
 *     in `CourseEnrollment.termsAcceptedAt` / `JobPosting.termsAcceptedAt` is
 *     proven by recovering the accepted version with
 *     `git log --until=<timestamp> -- <this file>`, which only works while the
 *     text is in git and not spread across many files.
 *     Process: docs/LEGAL_DOCUMENTS.md.
 *   - Bump the date in `PrivacyAsOfDate` whenever the text changes.
 */

type SectionProps = { n: number };

const useIsEnglish = () => useRouter().locale === 'en';

/** Matches the fallback the retention job itself uses when the setting is unreadable. */
const DEFAULT_GUEST_RETENTION_MONTHS = 12;

export const PrivacyOverview: FC<SectionProps & { imprintHref: string; children?: ReactNode }> = ({
  n,
  imprintHref,
  children,
}) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Data Protection at a Glance' : 'Datenschutz auf einen Blick'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'General Information' : 'Allgemeine Hinweise'}</h3>
      <p>
        {isEnglish
          ? 'The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data with which you can be personally identified. Detailed information on the subject of data protection can be found in our privacy policy listed below this text.'
          : 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit deinen personenbezogenen Daten passiert, wenn du diese Website besuchst. Personenbezogene Daten sind alle Daten, mit denen du persönlich identifiziert werden kannst. Ausführliche Informationen zum Thema Datenschutz entnimmst du unserer unter diesem Text aufgeführten Datenschutzerklärung.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Data Collection on This Website' : 'Datenerfassung auf dieser Website'}
      </h3>
      <p>
        <strong>
          {isEnglish
            ? 'Who is responsible for data collection on this website?'
            : 'Wer ist verantwortlich für die Datenerfassung auf dieser Website?'}
        </strong>
      </p>
      <p>
        {isEnglish
          ? 'Data processing on this website is carried out by Campus Business Box e.V., Fraunhoferstr. 13, 24118 Kiel.'
          : 'Die Datenverarbeitung auf dieser Website erfolgt durch den Campus Business Box e.V., Fraunhoferstr. 13, 24118 Kiel.'}
      </p>
      <p>
        <strong>{isEnglish ? 'How do we collect your data?' : 'Wie erfassen wir deine Daten?'}</strong>
      </p>
      <p>
        {isEnglish
          ? 'Your data is collected, on the one hand, by you providing it to us. This can be, for example, data that you enter into a contact form.'
          : 'Deine Daten werden zum einen dadurch erhoben, dass du uns diese mitteilst. Hierbei kann es sich z. B. um Daten handeln, die du in ein Kontaktformular eingibst.'}
      </p>
      <p>
        {isEnglish
          ? 'Other data is collected automatically or after your consent when you visit the website by our IT systems. This is mainly technical data (e.g., internet browser, operating system, or time of page access). This data is collected automatically as soon as you enter this website.'
          : 'Andere Daten werden automatisch oder nach deiner Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald du diese Website betrittst.'}
      </p>
      <p>
        <strong>{isEnglish ? 'What do we use your data for?' : 'Wofür nutzen wir deine Daten?'}</strong>
      </p>
      <p>
        {isEnglish
          ? 'Some of the data is collected to ensure error-free provision of the website. Other data may be used to analyze your user behavior.'
          : 'Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse deines Nutzerverhaltens verwendet werden.'}
      </p>
      <p>
        <strong>
          {isEnglish ? 'What rights do you have regarding your data?' : 'Welche Rechte hast du bezüglich deiner Daten?'}
        </strong>
      </p>
      <p>
        {isEnglish
          ? 'You have the right to receive information free of charge at any time about the origin, recipient, and purpose of your stored personal data. You also have the right to request the correction or deletion of this data. If you have given consent to data processing, you can revoke this consent at any time for the future. You also have the right to request the restriction of processing of your personal data under certain circumstances. Furthermore, you have the right to lodge a complaint with the competent supervisory authority.'
          : 'Du hast jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten personenbezogenen Daten zu erhalten. Du hast außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn du eine Einwilligung zur Datenverarbeitung erteilt hast, kannst du diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem hast du das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen. Des Weiteren steht dir ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.'}
      </p>
      <p>
        {isEnglish
          ? 'For this purpose and for further questions on the subject of data protection, you can contact us at any time at the address given in the '
          : 'Hierzu sowie zu weiteren Fragen zum Thema Datenschutz kannst du dich jederzeit unter der im '}
        <Link href={imprintHref} className="underline hover:text-label-secondary">
          {isEnglish ? 'Imprint' : 'Impressum'}
        </Link>
        {isEnglish ? '.' : ' angegebenen Adresse an uns wenden.'}
      </p>
      {children}
    </>
  );
};

export const PrivacyOverviewTracking: FC = () => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Analysis Tools and Third-Party Tools' : 'Analyse-Tools und Tools von Drittanbietern'}
      </h3>
      <p>
        {isEnglish
          ? 'When you visit this website, your surfing behavior may be statistically analyzed. This is done primarily with cookies and with so-called analysis programs. Detailed information about these analysis programs can be found in the sections on consent management and web analytics of this privacy policy.'
          : 'Beim Besuch dieser Website kann dein Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit Cookies und mit sogenannten Analyseprogrammen. Detaillierte Informationen zu diesen Analyseprogrammen findest du in den Abschnitten zur Einwilligungsverwaltung und zur Webanalyse dieser Datenschutzerklärung.'}
      </p>
    </>
  );
};

export const PrivacyHosting: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Hosting' : 'Hosting'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Google Cloud Platform' : 'Google Cloud Platform'}</h3>
      <p>
        {isEnglish
          ? 'This website is hosted on Google Cloud Platform (GCP). The provider is Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.'
          : 'Diese Website wird auf der Google Cloud Platform (GCP) gehostet. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.'}
      </p>
      <p>
        {isEnglish
          ? 'The personal data collected on this website is stored on Google servers. This may include IP addresses, contact requests, meta and communication data, contract data, contact details, names, website access, and other data generated via a website.'
          : 'Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf Servern von Google gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Webseitenzugriffe und sonstige Daten, die über eine Website generiert werden, handeln.'}
      </p>
      <p>
        {isEnglish
          ? 'The use of Google Cloud Platform is for the purpose of contract fulfillment towards our potential and existing customers (Art. 6 para. 1 lit. b GDPR) and in the interest of a secure, fast, and efficient provision of our online offer by a professional provider (Art. 6 para. 1 lit. f GDPR).'
          : 'Der Einsatz von Google Cloud Platform erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).'}
      </p>
      <p>
        {isEnglish
          ? 'Data processing takes place on servers within the European Union (EU region europe-west).'
          : 'Die Datenverarbeitung erfolgt auf Servern innerhalb der Europäischen Union (EU-Region europe-west).'}
      </p>
      <p>
        {isEnglish
          ? 'A contract for data processing (DPA) exists with Google in accordance with Art. 28 GDPR.'
          : 'Mit Google besteht ein Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO.'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://cloud.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://cloud.google.com/privacy
        </a>
      </p>
    </>
  );
};

export const PrivacyGeneralInfo: FC<SectionProps & { imprintHref: string }> = ({ n, imprintHref }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}.{' '}
        {isEnglish ? 'General Information and Mandatory Information' : 'Allgemeine Hinweise und Pflichtinformationen'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Data Protection' : 'Datenschutz'}</h3>
      <p>
        {isEnglish
          ? 'The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy.'
          : 'Die Betreiber dieser Seiten nehmen den Schutz deiner persönlichen Daten sehr ernst. Wir behandeln deine personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.'}
      </p>
      <p>
        {isEnglish
          ? 'When you use this website, various personal data is collected. Personal data is data with which you can be personally identified. This privacy policy explains what data we collect and what we use it for. It also explains how and for what purpose this happens.'
          : 'Wenn du diese Website benutzt, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen du persönlich identifiziert werden kannst. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.'}
      </p>
      <p>
        {isEnglish
          ? 'We point out that data transmission on the Internet (e.g., when communicating by email) can have security gaps. Complete protection of data against access by third parties is not possible.'
          : 'Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Note on the Responsible Party' : 'Hinweis zur verantwortlichen Stelle'}
      </h3>
      <p>
        {isEnglish
          ? 'The responsible party for data processing on this website is:'
          : 'Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:'}
      </p>
      <p>
        Campus Business Box e.V.
        <br />
        Fraunhoferstr. 13
        <br />
        24118 Kiel
      </p>
      <p>
        {isEnglish ? 'Phone' : 'Telefon'}: +49 (0) 431 9089 4380
        <br />
        Email: <a href="mailto:edu@opencampus.sh">edu @ opencampus.sh</a>
      </p>
      <p>
        {isEnglish
          ? 'The responsible party is the natural or legal person who alone or jointly with others decides on the purposes and means of processing personal data (e.g., names, email addresses, etc.).'
          : 'Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish
          ? 'Revocation of Your Consent to Data Processing'
          : 'Widerruf deiner Einwilligung zur Datenverarbeitung'}
      </h3>
      <p>
        {isEnglish
          ? 'Many data processing operations are only possible with your express consent. You can revoke consent you have already given at any time. An informal email to us is sufficient for this. The lawfulness of the data processing carried out until the revocation remains unaffected by the revocation.'
          : 'Viele Datenverarbeitungsvorgänge sind nur mit deiner ausdrücklichen Einwilligung möglich. Du kannst eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish
          ? 'Right to Object to Data Collection in Special Cases and to Direct Advertising (Art. 21 GDPR)'
          : 'Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)'}
      </h3>
      <p>
        {isEnglish
          ? 'IF DATA PROCESSING IS CARRIED OUT ON THE BASIS OF ART. 6 PARA. 1 LIT. E OR F GDPR, YOU HAVE THE RIGHT TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA AT ANY TIME FOR REASONS ARISING FROM YOUR PARTICULAR SITUATION; THIS ALSO APPLIES TO PROFILING BASED ON THESE PROVISIONS. THE RESPECTIVE LEGAL BASIS ON WHICH PROCESSING IS BASED CAN BE FOUND IN THIS PRIVACY POLICY. IF YOU OBJECT, WE WILL NO LONGER PROCESS YOUR AFFECTED PERSONAL DATA UNLESS WE CAN DEMONSTRATE COMPELLING LEGITIMATE GROUNDS FOR PROCESSING THAT OVERRIDE YOUR INTERESTS, RIGHTS, AND FREEDOMS OR THE PROCESSING SERVES TO ASSERT, EXERCISE, OR DEFEND LEGAL CLAIMS (OBJECTION PURSUANT TO ART. 21 PARA. 1 GDPR).'
          : 'WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HAST DU JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS DEINER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG DEINER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNIMMST DU DIESER DATENSCHUTZERKLÄRUNG. WENN DU WIDERSPRUCH EINLEGST, WERDEN WIR DEINE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE DEINE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).'}
      </p>
      <p>
        {isEnglish
          ? 'IF YOUR PERSONAL DATA IS PROCESSED FOR THE PURPOSE of DIRECT ADVERTISING, YOU HAVE THE RIGHT TO OBJECT AT ANY TIME TO THE PROCESSING OF PERSONAL DATA CONCERNING YOU FOR THE PURPOSE OF SUCH ADVERTISING; THIS ALSO APPLIES TO PROFILING INSOFAR AS IT IS RELATED TO SUCH DIRECT ADVERTISING. IF YOU OBJECT, YOUR PERSONAL DATA WILL SUBSEQUENTLY NO LONGER BE USED FOR THE PURPOSE OF DIRECT ADVERTISING (OBJECTION PURSUANT TO ART. 21 PARA. 2 GDPR).'
          : 'WERDEN DEINE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HAST DU DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG DICH BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN DU WIDERSPRICHST, WERDEN DEINE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish
          ? 'Right to Lodge a Complaint with the Competent Supervisory Authority'
          : 'Beschwerderecht bei der zuständigen Aufsichtsbehörde'}
      </h3>
      <p>
        {isEnglish
          ? 'In the event of violations of the GDPR, data subjects have the right to lodge a complaint with a supervisory authority, in particular in the member state of their habitual residence, their place of work, or the place of the alleged violation. The right to lodge a complaint exists without prejudice to other administrative or judicial remedies.'
          : 'Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Right to Data Portability' : 'Recht auf Datenübertragbarkeit'}
      </h3>
      <p>
        {isEnglish
          ? 'You have the right to have data that we process automatically on the basis of your consent or in fulfillment of a contract handed over to you or to a third party in a common, machine-readable format. If you request the direct transfer of data to another responsible party, this will only be done insofar as it is technically feasible.'
          : 'Du hast das Recht, Daten, die wir auf Grundlage deiner Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an dich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern du die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangst, erfolgt dies nur, soweit es technisch machbar ist.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'SSL or TLS Encryption' : 'SSL- bzw. TLS-Verschlüsselung'}
      </h3>
      <p>
        {isEnglish
          ? 'This site uses SSL or TLS encryption for security reasons and to protect the transmission of confidential content, such as orders or requests that you send to us as the site operator. You can recognize an encrypted connection by the fact that the address line of the browser changes from "http://" to "https://" and by the lock symbol in your browser line.'
          : 'Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die du an uns als Seitenbetreiber sendest, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennst du daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem Schloss-Symbol in deiner Browserzeile.'}
      </p>
      <p>
        {isEnglish
          ? 'If SSL or TLS encryption is activated, the data you transmit to us cannot be read by third parties.'
          : 'Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die du an uns übermittelst, nicht von Dritten mitgelesen werden.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Information, Deletion, and Correction' : 'Auskunft, Löschung und Berichtigung'}
      </h3>
      <p>
        {isEnglish
          ? 'Within the framework of the applicable legal provisions, you have the right to free information about your stored personal data, its origin and recipient, and the purpose of data processing and, if applicable, a right to correction or deletion of this data at any time. For this purpose and for further questions on the subject of personal data, you can contact us at any time at the address given in the '
          : 'Du hast im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über deine gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten kannst du dich jederzeit unter der im '}
        <Link href={imprintHref} className="underline hover:text-label-secondary">
          {isEnglish ? 'Imprint' : 'Impressum'}
        </Link>
        {isEnglish ? '.' : ' angegebenen Adresse an uns wenden.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Right to Restriction of Processing' : 'Recht auf Einschränkung der Verarbeitung'}
      </h3>
      <p>
        {isEnglish
          ? 'You have the right to request the restriction of processing of your personal data. For this purpose, you can contact us at any time at the address given in the '
          : 'Du hast das Recht, die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen. Hierzu kannst du dich jederzeit unter der im '}
        <Link href={imprintHref} className="underline hover:text-label-secondary">
          {isEnglish ? 'Imprint' : 'Impressum'}
        </Link>
        {isEnglish
          ? '. The right to restriction of processing exists in the following cases:'
          : ' angegebenen Adresse an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:'}
      </p>
      <ul className="list-disc list-inside pl-5">
        <li>
          {isEnglish
            ? 'If you dispute the accuracy of your personal data stored with us, we usually need time to verify this. For the duration of the verification, you have the right to request the restriction of processing of your personal data.'
            : 'Wenn du die Richtigkeit deiner bei uns gespeicherten personenbezogenen Daten bestreitest, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung hast du das Recht, die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen.'}
        </li>
        <li>
          {isEnglish
            ? 'If the processing of your personal data happened/is happening unlawfully, you can request the restriction of data processing instead of deletion.'
            : 'Wenn die Verarbeitung deiner personenbezogenen Daten unrechtmäßig geschah/geschieht, kannst du statt der Löschung die Einschränkung der Datenverarbeitung verlangen.'}
        </li>
        <li>
          {isEnglish
            ? 'If we no longer need your personal data, but you need it to exercise, defend, or assert legal claims, you have the right to request the restriction of processing of your personal data instead of deletion.'
            : 'Wenn wir deine personenbezogenen Daten nicht mehr benötigen, du sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigst, hast du das Recht, statt der Löschung die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen.'}
        </li>
        <li>
          {isEnglish
            ? 'If you have lodged an objection pursuant to Art. 21 para. 1 GDPR, a balancing of interests between your and our interests must be carried out. As long as it has not yet been determined whose interests prevail, you have the right to request the restriction of processing of your personal data.'
            : 'Wenn du einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt hast, muss eine Abwägung zwischen deinen und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, hast du das Recht, die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen.'}
        </li>
      </ul>
      <p>
        {isEnglish
          ? 'If you have restricted the processing of your personal data, this data may only be processed—apart from its storage—with your consent or for the assertion, exercise, or defense of legal claims or for the protection of the rights of another natural or legal person or for reasons of an important public interest of the European Union or a member state.'
          : 'Wenn du die Verarbeitung deiner personenbezogenen Daten eingeschränkt hast, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit deiner Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Objection to Advertising Emails' : 'Widerspruch gegen Werbe-E-Mails'}
      </h3>
      <p>
        {isEnglish
          ? 'The use of contact data published within the framework of the imprint obligation for sending unsolicited advertising and information materials is hereby objected to. The operators of the pages expressly reserve the right to take legal action in the event of unsolicited sending of advertising information, such as spam emails.'
          : 'Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.'}
      </p>
    </>
  );
};

export const PrivacyDataCollection: FC<SectionProps & { children?: ReactNode }> = ({ n, children }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Data Collection on This Website' : 'Datenerfassung auf dieser Website'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Server Log Files' : 'Server-Log-Dateien'}</h3>
      <p>
        {isEnglish
          ? 'The provider of the pages automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are:'
          : 'Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die dein Browser automatisch an uns übermittelt. Dies sind:'}
      </p>
      <ul className="list-disc list-inside pl-5">
        <li>{isEnglish ? 'Browser type and browser version' : 'Browsertyp und Browserversion'}</li>
        <li>{isEnglish ? 'Operating system used' : 'verwendetes Betriebssystem'}</li>
        <li>{isEnglish ? 'Referrer URL' : 'Referrer URL'}</li>
        <li>{isEnglish ? 'Hostname of the accessing computer' : 'Hostname des zugreifenden Rechners'}</li>
        <li>{isEnglish ? 'Time of server request' : 'Uhrzeit der Serveranfrage'}</li>
        <li>{isEnglish ? 'IP address' : 'IP-Adresse'}</li>
      </ul>
      <p>
        {isEnglish
          ? 'A combination of this data with other data sources is not carried out.'
          : 'Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.'}
      </p>
      <p>
        {isEnglish
          ? 'The collection of this data is based on Art. 6 para. 1 lit. f GDPR. The website operator has a legitimate interest in the technically error-free presentation and optimization of its website—for this purpose, the server log files must be collected.'
          : 'Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Request by Email, Phone, or Fax' : 'Anfrage per E-Mail, Telefon oder Telefax'}
      </h3>
      <p>
        {isEnglish
          ? 'If you contact us by email, phone, or fax, your request including all resulting personal data (name, request) will be stored and processed by us for the purpose of processing your request. We do not pass on this data without your consent.'
          : 'Wenn du uns per E-Mail, Telefon oder Telefax kontaktierst, wird deine Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung deines Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne deine Einwilligung weiter.'}
      </p>
      <p>
        {isEnglish
          ? 'The processing of this data is based on Art. 6 para. 1 lit. b GDPR if your request is related to the fulfillment of a contract or is necessary for the implementation of pre-contractual measures. In all other cases, the processing is based on our legitimate interest in the effective processing of the requests addressed to us (Art. 6 para. 1 lit. f GDPR) or on your consent (Art. 6 para. 1 lit. a GDPR) if this has been requested.'
          : 'Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern deine Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde.'}
      </p>
      <p>
        {isEnglish
          ? 'The data you send to us via contact requests will remain with us until you request deletion, revoke your consent to storage, or the purpose for data storage no longer applies (e.g., after your request has been processed). Mandatory legal provisions—in particular statutory retention periods—remain unaffected.'
          : 'Die von dir an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis du uns zur Löschung aufforderst, deine Einwilligung zur Speicherung widerrufst oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung deines Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.'}
      </p>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Profile Information' : 'Profilinformationen'}</h3>
      <p>
        {isEnglish
          ? 'The website operator stores the profile data of your user account (name, email address and, where applicable, student status and university) in order to provide and support the services you use (Art. 6 para. 1 lit. f GDPR).'
          : 'Der Websitebetreiber speichert die Profildaten deines Nutzerkontos (Name, E-Mail-Adresse sowie ggf. Studentenstatus und Hochschule), um die von dir genutzten Angebote bereitzustellen und zu unterstützen (Art. 6 Abs. 1 lit. f DSGVO).'}
      </p>
      {children}
    </>
  );
};

/** Shared: StuJo employer accounts ARE edu-hub organization accounts (same
 * Organization / OrganizationAdmin grant, `canManageJobs` instead of
 * `canManageDegrees`), so both apps render this. */
export const PrivacyOrganizationAccounts: FC = () => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Company and Organization Accounts' : 'Unternehmens- und Organisationskonten'}
      </h3>
      <p>
        {isEnglish
          ? 'Your user account can be linked to an organization, for example your company or your university. That link is a management permission which records which areas of the organization you may administer.'
          : 'Dein Nutzerkonto kann mit einer Organisation verknüpft werden, etwa mit deinem Unternehmen oder deiner Hochschule. Diese Verknüpfung ist eine Verwaltungsberechtigung und legt fest, welche Bereiche der Organisation du verwalten darfst.'}
      </p>
      <p>
        {isEnglish
          ? 'For an organization we store its name and any alternative spellings of that name, a logo, a description and - where paid services are used - the details required for invoicing. We also store who holds a management permission for the organization and how far that permission reaches.'
          : 'Zu einer Organisation speichern wir ihren Namen sowie ggf. abweichende Namensschreibweisen, ein Logo, eine Beschreibung und - bei kostenpflichtigen Leistungen - die zur Rechnungsstellung erforderlichen Angaben. Außerdem speichern wir, welche Personen eine Verwaltungsberechtigung für die Organisation besitzen und welchen Umfang diese hat.'}
      </p>
      <p>
        {isEnglish
          ? 'When you claim an organization, you confirm that you are authorized to act for it; that confirmation is recorded. If you request access to an organization that someone else already administers, we notify that person about your request.'
          : 'Wenn du eine Organisation für dich beanspruchst, bestätigst du dabei, dass du berechtigt bist, für diese Organisation zu handeln. Diese Bestätigung wird gespeichert. Beantragst du Zugriff auf eine Organisation, die bereits von einer anderen Person verwaltet wird, informieren wir diese Person über deine Anfrage.'}
      </p>
      <p>
        {isEnglish
          ? 'The legal basis for the account and the management permission is Art. 6 para. 1 lit. b GDPR (establishing and carrying out the use relationship). Checking the authorization and notifying the person already registered are based on Art. 6 para. 1 lit. f GDPR; our legitimate interest is to prevent unauthorized people from gaining access to a company account.'
          : 'Rechtsgrundlage für das Konto und die Verwaltungsberechtigung ist Art. 6 Abs. 1 lit. b DSGVO (Begründung und Durchführung des Nutzungsverhältnisses). Die Prüfung der Berechtigung und die Benachrichtigung der bereits eingetragenen Person erfolgen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt darin zu verhindern, dass Unbefugte Zugriff auf das Konto eines Unternehmens erhalten.'}
      </p>
      <p>
        {isEnglish
          ? 'We keep this data for as long as the management permission exists. Invoice data is retained for the statutory periods regardless (section 147 AO, section 257 HGB).'
          : 'Wir speichern diese Daten, solange die Verwaltungsberechtigung besteht. Rechnungsdaten bewahren wir unabhängig davon für die gesetzlichen Aufbewahrungsfristen auf (§ 147 AO, § 257 HGB).'}
      </p>
      <p>
        {isEnglish
          ? 'Organization names are visible to other signed-in users so that they can pick their own company when linking their account.'
          : 'Namen von Organisationen sind für andere angemeldete Nutzende sichtbar, damit diese bei der Zuordnung ihres Kontos ihr eigenes Unternehmen auswählen können.'}
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyCourseParticipation: FC = () => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Course Participation Information' : 'Informationen zur Kursteilnahme'}
      </h3>
      <p>
        {isEnglish
          ? 'The website operator stores data on courses for which registered users have applied or participated, as well as related information about the fulfillment of the set performance criteria for the courses that are needed for certificate issuance (Art. 6 para. 1 lit. f GDPR).'
          : 'Der Websitebetreiber speichert Daten zu Kursen, für die sich registrierte Nutzer:innen beworben haben bzw. an denen sie teilgenommen haben sowie zugehörige Informationen über die Erfüllung der angesetzten Leistungskriterien für die Kurse, die zur Ausstellung der Zertifikate benötigt werden (Art. 6 Abs. 1 lit. f DSGVO).'}
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyGuestRegistration: FC = () => {
  const isEnglish = useIsEnglish();

  // Read rather than hardcoded: this paragraph is a statement about what we
  // actually do, and the period is configurable.
  const {
    data: retentionData,
    loading: retentionLoading,
    error: retentionError,
  } = useRoleQuery<GuestDataRetentionMonths>(GUEST_DATA_RETENTION_MONTHS, {
    context: { role: AuthRoles.anonymous },
  });
  // Only a successful response tells us the period. While the query is in
  // flight -- which includes the statically prerendered HTML -- or after it
  // errored, we do not know it, and a legal document must not assert a number
  // it has not confirmed. The default applies only when the answer came back
  // without a setting.
  const retentionKnown = !retentionLoading && !retentionError && !!retentionData;
  const retentionMonths = retentionData?.AppSettings?.[0]?.guestDataRetentionMonths ?? DEFAULT_GUEST_RETENTION_MONTHS;
  const retentionPeriod = isEnglish
    ? `${retentionMonths} ${retentionMonths === 1 ? 'month' : 'months'}`
    : `${retentionMonths} ${retentionMonths === 1 ? 'Monat' : 'Monaten'}`;

  return (
    <>
      <h3 className="text-lg mt-2 mb-2 italic">
        {isEnglish ? 'Guest Registration for Events' : 'Gast-Anmeldung zu Veranstaltungen'}
      </h3>
      <p>
        {isEnglish
          ? 'For some events you can register without creating a user account ("guest registration"). In that case we only collect your first name, last name, and email address. We use this data solely to run the event you registered for: to confirm your registration, to keep the participant list, and to inform you about changes to that event (for example a change of date or its cancellation).'
          : 'Für manche Veranstaltungen kannst du dich anmelden, ohne ein Nutzerkonto anzulegen („Gast-Anmeldung"). Dabei erheben wir ausschließlich deinen Vornamen, deinen Nachnamen und deine E-Mail-Adresse. Wir verwenden diese Daten allein zur Durchführung der Veranstaltung, für die du dich angemeldet hast: zur Bestätigung deiner Anmeldung, für die Teilnahmeliste und um dich über Änderungen an dieser Veranstaltung zu informieren (etwa eine Terminverschiebung oder den Ausfall).'}
      </p>
      <p>
        {isEnglish
          ? 'The legal basis is Art. 6 para. 1 lit. b GDPR (performance of a contract and pre-contractual measures). Providing the data is voluntary, but without it we cannot register you for the event.'
          : 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung und vorvertragliche Maßnahmen). Die Angabe der Daten ist freiwillig, ohne sie können wir dich aber nicht zur Veranstaltung anmelden.'}
      </p>
      <p>
        {isEnglish
          ? 'To make sure the email address really belongs to you, a guest registration only becomes valid once you confirm it via a link we send you (double opt-in). If you do not confirm within 7 days, we delete the data you entered.'
          : 'Damit sichergestellt ist, dass die E-Mail-Adresse wirklich dir gehört, wird eine Gast-Anmeldung erst gültig, wenn du sie über einen Link bestätigst, den wir dir zusenden (Double-Opt-in). Bestätigst du nicht innerhalb von 7 Tagen, löschen wir die von dir eingegebenen Daten.'}
      </p>
      {retentionKnown && (
        <p>
          {isEnglish
            ? `We delete guest data automatically ${retentionPeriod} after the event has ended.`
            : `Wir löschen Gast-Daten automatisch ${retentionPeriod} nach dem Ende der Veranstaltung.`}
        </p>
      )}
      <p>
        {isEnglish
          ? 'Independently of that, every email you receive from us about the event contains a link through which you can view your stored data, cancel your registration, or have your data deleted at any time - no account or login required.'
          : 'Unabhängig davon enthält jede E-Mail, die du von uns zu der Veranstaltung erhältst, einen Link, über den du deine gespeicherten Daten jederzeit einsehen, deine Anmeldung stornieren oder deine Daten löschen lassen kannst - ohne Konto und ohne Anmeldung.'}
      </p>
      <p>
        {isEnglish
          ? 'We do not use guest data to advertise other events unless you have separately and explicitly consented to that (see "Newsletter" below).'
          : 'Wir nutzen Gast-Daten nicht, um für andere Veranstaltungen zu werben, es sei denn, du hast dem gesondert und ausdrücklich zugestimmt (siehe „Newsletter" unten).'}
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyNewsletter: FC = () => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Newsletter' : 'Newsletter'}</h3>
      <p>
        {isEnglish
          ? 'When registering for an event, or in your profile, you can separately consent to being informed by email about future events and offers from the respective organizer. This consent is optional: your registration and your use of the platform never depend on it.'
          : 'Bei der Anmeldung zu einer Veranstaltung oder in deinem Profil kannst du gesondert einwilligen, per E-Mail über künftige Veranstaltungen und Angebote des jeweiligen Veranstalters informiert zu werden. Diese Einwilligung ist freiwillig: Deine Anmeldung und die Nutzung der Plattform hängen nie davon ab.'}
      </p>
      <p>
        {isEnglish
          ? 'The legal basis is your consent under Art. 6 para. 1 lit. a GDPR and Section 7 (2) no. 2 UWG. After you consent, you receive a confirmation email and are only added to the distribution list once you confirm (double opt-in). We store your email address and the subscription status for this purpose.'
          : 'Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 7 Abs. 2 Nr. 2 UWG. Nach deiner Einwilligung erhältst du eine Bestätigungs-E-Mail und wirst erst in den Verteiler aufgenommen, wenn du bestätigst (Double-Opt-in). Wir speichern hierfür deine E-Mail-Adresse und den Status des Abonnements.'}
      </p>
      <p>
        {isEnglish
          ? 'You can withdraw your consent at any time with effect for the future - via the unsubscribe link in every newsletter, in your profile, or by an informal message to us. Withdrawal does not affect the lawfulness of processing carried out before it. After withdrawal we remove your address from the distribution list.'
          : 'Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen - über den Abmeldelink in jedem Newsletter, in deinem Profil oder durch eine formlose Mitteilung an uns. Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung. Nach dem Widerruf entfernen wir deine Adresse aus dem Verteiler.'}
      </p>
      <p>
        {isEnglish
          ? 'We use "Ghost" (Ghost Foundation) to send the newsletter. Ghost is used exclusively as a technical service provider and data processor in accordance with Art. 28 GDPR and processes the data only on our instructions.'
          : 'Für den Versand des Newsletters setzen wir „Ghost" (Ghost Foundation) ein. Ghost wird ausschließlich als technischer Dienstleister und Auftragsverarbeiter gemäß Art. 28 DSGVO eingesetzt und verarbeitet die Daten nur auf unsere Weisung.'}
      </p>
    </>
  );
};

/** StuJo only -- edu-hub has no job board. */
export const PrivacyJobPostings: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Job Postings' : 'Stellenanzeigen'}
      </h2>
      <p>
        {isEnglish
          ? 'When you create a posting, we store the details you enter: category, field of work, region, title, description and short description, requirements, location, information on pay, start and duration, application deadline, hours per week, language, the company - or a freely entered company name when you post on behalf of another company - and optionally a PDF file. The person creating the posting is also stored as its contact.'
          : 'Wenn du eine Anzeige erstellst, speichern wir die von dir eingegebenen Angaben: Kategorie, Berufsfeld, Region, Titel, Beschreibung und Kurzbeschreibung, Anforderungen, Einsatzort, Angaben zu Vergütung, Beginn und Dauer, Bewerbungsfrist, Stundenumfang, Sprache, das Unternehmen - oder einen frei eingegebenen Unternehmensnamen, wenn du für ein anderes Unternehmen ausschreibst - sowie optional eine PDF-Datei. Zusätzlich wird die erstellende Person als Ansprechperson zur Anzeige gespeichert.'}
      </p>
      <p>
        {isEnglish
          ? 'A published posting is public: it is visible to every visitor of this site, can be opened directly via its address and may be indexed by search engines. Everything you enter into a posting is intended for publication, so please do not enter personal data there that should not be published. Postings restricted to one university are only visible to members of that university.'
          : 'Eine veröffentlichte Anzeige ist öffentlich: Sie ist für alle Besuchenden dieser Seite sichtbar, über ihre Adresse direkt aufrufbar und kann von Suchmaschinen erfasst werden. Alles, was du in eine Anzeige einträgst, ist zur Veröffentlichung bestimmt - trage dort daher keine personenbezogenen Daten ein, die nicht veröffentlicht werden sollen. Anzeigen, die auf eine Hochschule beschränkt sind, sind nur für Angehörige dieser Hochschule sichtbar.'}
      </p>
      <p>
        {isEnglish
          ? 'A posting is published for the period stated during ordering and archived afterwards; archived postings no longer appear in the job list. You can archive your posting earlier at any time.'
          : 'Eine Anzeige wird für die im Bestellvorgang angegebene Laufzeit veröffentlicht und danach archiviert; archivierte Anzeigen werden nicht mehr in der Stellenübersicht angezeigt. Du kannst deine Anzeige jederzeit vorzeitig archivieren.'}
      </p>
      <p>
        {isEnglish
          ? 'When a paid posting is published, we store the time at which you accepted the terms and conditions, as proof of the posting contract that came into being.'
          : 'Beim Veröffentlichen einer kostenpflichtigen Anzeige speichern wir den Zeitpunkt, zu dem du die AGB akzeptiert hast, als Nachweis des zustande gekommenen Schaltungsvertrages.'}
      </p>
      <p>
        {isEnglish
          ? 'We keep a view counter for each posting. It is a plain total; individual views are not attributed to people.'
          : 'Zu jeder Anzeige führen wir einen Zähler der Seitenaufrufe. Es handelt sich um einen reinen Summenwert; die einzelnen Aufrufe werden nicht Personen zugeordnet.'}
      </p>
      <p>
        {isEnglish
          ? 'The legal basis for creating, publishing and archiving a posting is Art. 6 para. 1 lit. b GDPR (performance of the posting contract under our terms and conditions). The view counter is based on Art. 6 para. 1 lit. f GDPR; our legitimate interest is in assessing the reach of the job board.'
          : 'Rechtsgrundlage für das Erstellen, Veröffentlichen und Archivieren einer Anzeige ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Schaltungsvertrages nach unseren AGB). Der Aufrufzähler erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der Auswertung der Reichweite der Stellenbörse.'}
      </p>
      <p>
        {isEnglish
          ? 'PDF files you upload are stored in our storage on Google Cloud Platform; see the section on hosting.'
          : 'Von dir hochgeladene PDF-Dateien werden in unserem Speicher bei der Google Cloud Platform abgelegt; siehe dazu den Abschnitt zum Hosting.'}
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyFormbricks: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Data Collection via Formbricks' : 'Datenerfassung über Formbricks'}
      </h2>
      <p>
        {isEnglish
          ? 'We collect personal data through forms and surveys that are integrated within the EduHub platform. This includes:'
          : 'Wir erheben personenbezogene Daten über Formulare und Umfragen, die innerhalb der Plattform EduHub eingebunden sind. Dies umfasst:'}
      </p>
      <ul className="list-disc list-inside pl-5">
        <li>
          {isEnglish
            ? 'Registration and applications for courses, events, and other educational offerings'
            : 'Registrierung und Bewerbungen für Kurse, Veranstaltungen und andere Bildungsangebote'}
        </li>
        <li>
          {isEnglish
            ? 'Onboarding processes for courses, events, and new instructors'
            : 'Onboarding-Prozesse für Kurse, Veranstaltungen und neue Dozent:innen'}
        </li>
        <li>
          {isEnglish
            ? 'Evaluation surveys for past courses and events to improve our offerings and the platform'
            : 'Evaluationsumfragen zu vergangenen Kursen und Veranstaltungen zur Verbesserung unserer Angebote und der Plattform'}
        </li>
      </ul>
      <p>
        {isEnglish
          ? 'For this purpose, we use the tool "Formbricks" from Formbricks GmbH. Formbricks is used exclusively as a technical service provider and data processor in accordance with Art. 28 GDPR.'
          : 'Hierfür setzen wir das Tool „Formbricks" der Formbricks GmbH ein. Formbricks wird ausschließlich als technischer Dienstleister und Auftragsverarbeiter gemäß Art. 28 DSGVO eingesetzt.'}
      </p>
      <p>
        {isEnglish
          ? 'The processing of data is carried out exclusively on our instructions. For registration, applications, and onboarding processes, the data processing serves the purpose of carrying out pre-contractual measures as well as fulfilling the contract (Art. 6 para. 1 lit. b GDPR). For evaluation surveys, the data processing is based on our legitimate interest in improving our educational offerings and the platform (Art. 6 para. 1 lit. f GDPR).'
          : 'Die Verarbeitung der Daten erfolgt ausschließlich auf unsere Weisung. Für Registrierung, Bewerbungen und Onboarding-Prozesse dient die Datenverarbeitung dem Zweck der Durchführung vorvertraglicher Maßnahmen sowie der Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO). Für Evaluationsumfragen beruht die Datenverarbeitung auf unserem berechtigten Interesse an der Verbesserung unserer Bildungsangebote und der Plattform (Art. 6 Abs. 1 lit. f DSGVO).'}
      </p>
      <p>
        {isEnglish
          ? 'A contract for data processing (DPA) exists with the provider.'
          : 'Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung (AVV).'}
      </p>
      <p>
        {isEnglish
          ? 'The data is processed on servers within the European Union.'
          : 'Die Daten werden auf Servern innerhalb der Europäischen Union verarbeitet.'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://formbricks.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://formbricks.com/privacy
        </a>
      </p>
    </>
  );
};

export const PrivacyPayments: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Payment Processing' : 'Zahlungsabwicklung'}
      </h2>
      <p>
        {isEnglish
          ? 'For the processing of paid offerings, we use external payment service providers, currently Stripe.'
          : 'Für die Abwicklung kostenpflichtiger Angebote nutzen wir externe Zahlungsdienstleister, derzeit Stripe.'}
      </p>
      <p>
        {isEnglish
          ? 'Stripe is used as an independent responsible party for payment processing and as a data processor within the meaning of Art. 28 GDPR for certain processing operations.'
          : 'Stripe wird als eigenständiger Verantwortlicher für die Zahlungsabwicklung sowie als Auftragsverarbeiter im Sinne des Art. 28 DSGVO für bestimmte Verarbeitungsvorgänge eingesetzt.'}
      </p>
      <p>
        {isEnglish
          ? 'A contract for data processing (DPA) exists with the provider.'
          : 'Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung (AVV).'}
      </p>
      <p>
        {isEnglish
          ? 'The provider only receives the data necessary for payment processing. The platform operator does not have access to complete payment data (e.g., credit card numbers).'
          : 'Der Anbieter erhält nur die für die Zahlungsabwicklung erforderlichen Daten. Der Plattformbetreiber erhält keinen Zugriff auf vollständige Zahlungsdaten (z. B. Kreditkartennummern).'}
      </p>
      <p>
        {isEnglish
          ? 'The legal basis is Art. 6 para. 1 lit. b GDPR.'
          : 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://stripe.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://stripe.com/privacy
        </a>
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyConsentManagement: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Consent Management' : 'Einwilligungsverwaltung'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">Cookiebot</h3>
      <p>
        {isEnglish
          ? 'This website uses Cookiebot to obtain your consent for storing cookies and similar technologies on your device, and to document and manage these consents. The provider is Cybot A/S, Havnegade 39, 1058 Copenhagen, Denmark.'
          : 'Diese Website nutzt Cookiebot, um deine Einwilligung zur Speicherung von Cookies und ähnlichen Technologien auf deinem Endgerät einzuholen sowie diese Einwilligungen zu dokumentieren und zu verwalten. Anbieter ist Cybot A/S, Havnegade 39, 1058 Kopenhagen, Dänemark.'}
      </p>
      <p>
        {isEnglish
          ? 'When you access our website, a connection is established to Cookiebot servers to obtain your consents and provide other explanations regarding cookie usage. Cookiebot then stores a cookie in your browser to identify the consents you have given or their revocation. The data collected in this way is stored until you request deletion, delete the Cookiebot cookie yourself, or the purpose for data storage no longer applies. Mandatory legal retention obligations remain unaffected.'
          : 'Wenn du unsere Website aufrufst, wird eine Verbindung zu den Servern von Cookiebot hergestellt, um deine Einwilligungen und sonstigen Erklärungen zur Cookie-Nutzung einzuholen. Cookiebot speichert dann einen Cookie in deinem Browser, um dir die erteilten Einwilligungen bzw. deren Widerruf zuordnen zu können. Die so erfassten Daten werden gespeichert, bis du uns zur Löschung aufforderst, den Cookiebot-Cookie selbst löschst oder der Zweck für die Datenspeicherung entfällt. Zwingende gesetzliche Aufbewahrungspflichten bleiben unberührt.'}
      </p>
      <p>
        {isEnglish
          ? 'Cookiebot is used to obtain the legally required consents for the use of cookies. The legal basis is Art. 6 para. 1 lit. c GDPR.'
          : 'Der Einsatz von Cookiebot erfolgt, um die gesetzlich vorgeschriebenen Einwilligungen für den Einsatz von Cookies einzuholen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. c DSGVO.'}
      </p>
      <p>
        {isEnglish
          ? 'A contract for data processing (DPA) exists with the provider.'
          : 'Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung (AVV).'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://www.cookiebot.com/de/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://www.cookiebot.com/de/privacy-policy/
        </a>
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyAnalytics: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Web Analytics' : 'Webanalyse'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">Plausible Analytics</h3>
      <p>
        {isEnglish
          ? 'This website uses Plausible Analytics, a privacy-friendly web analytics service. The provider is Plausible Insights OÜ, Västriku tn 2, 50403 Tartu, Estonia.'
          : 'Diese Website nutzt Plausible Analytics, einen datenschutzfreundlichen Webanalysedienst. Anbieter ist Plausible Insights OÜ, Västriku tn 2, 50403 Tartu, Estland.'}
      </p>
      <p>
        {isEnglish
          ? 'Plausible Analytics does not use cookies and does not store any personal data. Only aggregated data is collected that cannot be traced back to individual persons. The data is processed exclusively on servers within the European Union.'
          : 'Plausible Analytics verwendet keine Cookies und speichert keine personenbezogenen Daten. Es werden ausschließlich aggregierte Daten erhoben, die nicht auf einzelne Personen zurückgeführt werden können. Die Verarbeitung erfolgt ausschließlich auf Servern innerhalb der Europäischen Union.'}
      </p>
      <p>
        {isEnglish
          ? 'The use of Plausible Analytics is based on your consent (Art. 6 para. 1 lit. a GDPR). The consent can be revoked at any time via the cookie settings.'
          : 'Die Nutzung von Plausible Analytics erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Die Einwilligung kann jederzeit über die Cookie-Einstellungen widerrufen werden.'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://plausible.io/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://plausible.io/privacy
        </a>
      </p>
    </>
  );
};

/** edu-hub only. */
export const PrivacyMarketing: FC<SectionProps> = ({ n }) => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <h2 className="text-xl mt-6 mb-2">
        {n}. {isEnglish ? 'Marketing' : 'Marketing'}
      </h2>
      <h3 className="text-lg mt-2 mb-2 italic">Meta Pixel (Facebook Pixel)</h3>
      <p>
        {isEnglish
          ? 'This website uses the Meta Pixel (formerly Facebook Pixel) for conversion measurement. The provider is Meta Platforms Ireland Limited, 4 Grand Canal Square, Dublin 2, Ireland.'
          : 'Diese Website nutzt das Meta Pixel (ehemals Facebook Pixel) zur Konversionsmessung. Anbieter ist Meta Platforms Ireland Limited, 4 Grand Canal Square, Dublin 2, Irland.'}
      </p>
      <p>
        {isEnglish
          ? 'The Meta Pixel allows us to track the behavior of website visitors after they have been redirected to our website by clicking on a Facebook ad. This enables us to evaluate the effectiveness of Facebook ads for statistical and market research purposes.'
          : 'Mit dem Meta Pixel kann das Verhalten von Seitenbesuchern nachverfolgt werden, nachdem diese durch Klick auf eine Facebook-Werbeanzeige auf unsere Website weitergeleitet wurden. So kann die Wirksamkeit der Facebook-Werbeanzeigen für statistische und Marktforschungszwecke ausgewertet werden.'}
      </p>
      <p>
        {isEnglish
          ? "The data collected in this way is anonymous to us, i.e., we do not see the personal data of individual users. However, this data is stored and processed by Meta. Meta can link this data to your Facebook account and use it for its own advertising purposes in accordance with Meta's data policy."
          : 'Die so erhobenen Daten sind für uns anonym, d. h. wir sehen nicht die personenbezogenen Daten einzelner Nutzer. Diese Daten werden jedoch von Meta gespeichert und verarbeitet. Meta kann diese Daten mit deinem Facebook-Konto verbinden und für eigene Werbezwecke entsprechend der Datenrichtlinie von Meta verwenden.'}
      </p>
      <p>
        {isEnglish
          ? 'The use of Meta Pixel is based on your consent (Art. 6 para. 1 lit. a GDPR). The consent can be revoked at any time via the cookie settings.'
          : 'Die Nutzung des Meta Pixels erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Die Einwilligung kann jederzeit über die Cookie-Einstellungen widerrufen werden.'}
      </p>
      <p>
        {isEnglish
          ? 'Data transfer to the USA is based on the EU-US Data Privacy Framework. Meta Platforms Inc. is certified under this framework.'
          : 'Die Datenübertragung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework. Meta Platforms Inc. ist unter diesem Rahmenwerk zertifiziert.'}
      </p>
      <p>
        {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
        <a
          href="https://www.facebook.com/privacy/policy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-label-secondary"
        >
          https://www.facebook.com/privacy/policy/
        </a>
      </p>
    </>
  );
};

export const PrivacyAsOfDate: FC = () => {
  const isEnglish = useIsEnglish();

  return (
    <>
      <div className="mt-12 mb-8">
        <p className="text-sm text-label-secondary">
          {isEnglish ? 'As of: September 9, 2026' : 'Stand: 9. September 2026'}
        </p>
      </div>
    </>
  );
};
