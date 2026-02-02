import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';

const Privacy: FC = () => {
  const { locale } = useRouter();
  const isEnglish = locale === 'en';

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>{isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'} | EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <div className="flex flex-row text-white">
          <h1 className="text-4xl font-bold p-24 pl-12 pb-0">
            {isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}
          </h1>
        </div>

        <div className="ml-12 mr-10">
          <h2 className="text-xl mt-6 mb-2">
            1. {isEnglish ? 'Data Protection at a Glance' : 'Datenschutz auf einen Blick'}
          </h2>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'General Information' : 'Allgemeine Hinweise'}
          </h3>
          <p>
            {isEnglish
              ? 'The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data with which you can be personally identified. Detailed information on the subject of data protection can be found in our privacy policy listed below this text.'
              : 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.'}
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
            <strong>{isEnglish ? 'How do we collect your data?' : 'Wie erfassen wir Ihre Daten?'}</strong>
          </p>
          <p>
            {isEnglish
              ? 'Your data is collected, on the one hand, by you providing it to us. This can be, for example, data that you enter into a contact form.'
              : 'Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.'}
          </p>
          <p>
            {isEnglish
              ? 'Other data is collected automatically or after your consent when you visit the website by our IT systems. This is mainly technical data (e.g., internet browser, operating system, or time of page access). This data is collected automatically as soon as you enter this website.'
              : 'Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.'}
          </p>
          <p>
            <strong>{isEnglish ? 'What do we use your data for?' : 'Wofür nutzen wir Ihre Daten?'}</strong>
          </p>
          <p>
            {isEnglish
              ? 'Some of the data is collected to ensure error-free provision of the website. Other data may be used to analyze your user behavior.'
              : 'Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.'}
          </p>
          <p>
            <strong>
              {isEnglish ? 'What rights do you have regarding your data?' : 'Welche Rechte haben Sie bezüglich Ihrer Daten?'}
            </strong>
          </p>
          <p>
            {isEnglish
              ? 'You have the right to receive information free of charge at any time about the origin, recipient, and purpose of your stored personal data. You also have the right to request the correction or deletion of this data. If you have given consent to data processing, you can revoke this consent at any time for the future. You also have the right to request the restriction of processing of your personal data under certain circumstances. Furthermore, you have the right to lodge a complaint with the competent supervisory authority.'
              : 'Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.'}
          </p>
          <p>
            {isEnglish
              ? 'For this purpose and for further questions on the subject of data protection, you can contact us at any time at the address given in the '
              : 'Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im '}
            <a href="/imprint" className="underline hover:text-gray-300">
              {isEnglish ? 'Imprint' : 'Impressum'}
            </a>
            {isEnglish ? '.' : ' angegebenen Adresse an uns wenden.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Analysis Tools and Third-Party Tools' : 'Analyse-Tools und Tools von Drittanbietern'}
          </h3>
          <p>
            {isEnglish
              ? 'When you visit this website, your surfing behavior may be statistically analyzed. This is done primarily with cookies and with so-called analysis programs.'
              : 'Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit Cookies und mit sogenannten Analyseprogrammen.'}
          </p>
          <p>
            {isEnglish
              ? 'Detailed information about these analysis programs can be found in the following privacy policy.'
              : 'Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.'}
          </p>

          <h2 className="text-xl mt-6 mb-2">
            2. {isEnglish ? 'Hosting and Content Delivery Networks (CDN)' : 'Hosting und Content Delivery Networks (CDN)'}
          </h2>
          <h3>{isEnglish ? 'External Hosting' : 'Externes Hosting'}</h3>
          <p>
            {isEnglish
              ? 'This website is hosted by an external service provider (host). The personal data collected on this website is stored on the host\'s servers. This may include IP addresses, contact requests, meta and communication data, contract data, contact details, names, website access, and other data generated via a website.'
              : 'Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Webseitenzugriffe und sonstige Daten, die über eine Website generiert werden, handeln.'}
          </p>
          <p>
            {isEnglish
              ? 'The use of the host is for the purpose of contract fulfillment towards our potential and existing customers (Art. 6 para. 1 lit. b GDPR) and in the interest of a secure, fast, and efficient provision of our online offer by a professional provider (Art. 6 para. 1 lit. f GDPR).'
              : 'Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).'}
          </p>
          <p>
            {isEnglish
              ? 'Our host will only process your data to the extent necessary to fulfill its performance obligations and follow our instructions regarding this data.'
              : 'Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten befolgen.'}
          </p>

          <h2 className="text-xl mt-6 mb-2">
            3. {isEnglish ? 'General Information and Mandatory Information' : 'Allgemeine Hinweise und Pflichtinformationen'}
          </h2>
          <h3 className="text-lg mt-2 mb-2 italic">{isEnglish ? 'Data Protection' : 'Datenschutz'}</h3>
          <p>
            {isEnglish
              ? 'The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy.'
              : 'Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.'}
          </p>
          <p>
            {isEnglish
              ? 'When you use this website, various personal data is collected. Personal data is data with which you can be personally identified. This privacy policy explains what data we collect and what we use it for. It also explains how and for what purpose this happens.'
              : 'Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.'}
          </p>
          <p>
            {isEnglish
              ? 'We point out that data transmission on the Internet (e.g., when communicating by email) can have security gaps. Complete protection of data against access by third parties is not possible.'
              : 'Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.'}
          </p>
          <h3>{isEnglish ? 'Note on the Responsible Party' : 'Hinweis zur verantwortlichen Stelle'}</h3>
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
            {isEnglish ? 'Revocation of Your Consent to Data Processing' : 'Widerruf Ihrer Einwilligung zur Datenverarbeitung'}
          </h3>
          <p>
            {isEnglish
              ? 'Many data processing operations are only possible with your express consent. You can revoke consent you have already given at any time. An informal email to us is sufficient for this. The lawfulness of the data processing carried out until the revocation remains unaffected by the revocation.'
              : 'Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish
              ? 'Right to Object to Data Collection in Special Cases and to Direct Advertising (Art. 21 GDPR)'
              : 'Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)'}
          </h3>
          <p>
            {isEnglish
              ? 'IF DATA PROCESSING IS CARRIED OUT ON THE BASIS OF ART. 6 PARA. 1 LIT. E OR F GDPR, YOU HAVE THE RIGHT TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA AT ANY TIME FOR REASONS ARISING FROM YOUR PARTICULAR SITUATION; THIS ALSO APPLIES TO PROFILING BASED ON THESE PROVISIONS. THE RESPECTIVE LEGAL BASIS ON WHICH PROCESSING IS BASED CAN BE FOUND IN THIS PRIVACY POLICY. IF YOU OBJECT, WE WILL NO LONGER PROCESS YOUR AFFECTED PERSONAL DATA UNLESS WE CAN DEMONSTRATE COMPELLING LEGITIMATE GROUNDS FOR PROCESSING THAT OVERRIDE YOUR INTERESTS, RIGHTS, AND FREEDOMS OR THE PROCESSING SERVES TO ASSERT, EXERCISE, OR DEFEND LEGAL CLAIMS (OBJECTION PURSUANT TO ART. 21 PARA. 1 GDPR).'
              : 'WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).'}
          </p>
          <p>
            {isEnglish
              ? 'IF YOUR PERSONAL DATA IS PROCESSED FOR THE PURPOSE of DIRECT ADVERTISING, YOU HAVE THE RIGHT TO OBJECT AT ANY TIME TO THE PROCESSING OF PERSONAL DATA CONCERNING YOU FOR THE PURPOSE OF SUCH ADVERTISING; THIS ALSO APPLIES TO PROFILING INSOFAR AS IT IS RELATED TO SUCH DIRECT ADVERTISING. IF YOU OBJECT, YOUR PERSONAL DATA WILL SUBSEQUENTLY NO LONGER BE USED FOR THE PURPOSE OF DIRECT ADVERTISING (OBJECTION PURSUANT TO ART. 21 PARA. 2 GDPR).'
              : 'WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).'}
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
              : 'Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'SSL or TLS Encryption' : 'SSL- bzw. TLS-Verschlüsselung'}
          </h3>
          <p>
            {isEnglish
              ? 'This site uses SSL or TLS encryption for security reasons and to protect the transmission of confidential content, such as orders or requests that you send to us as the site operator. You can recognize an encrypted connection by the fact that the address line of the browser changes from "http://" to "https://" and by the lock symbol in your browser line.'
              : 'Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.'}
          </p>
          <p>
            {isEnglish
              ? 'If SSL or TLS encryption is activated, the data you transmit to us cannot be read by third parties.'
              : 'Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Information, Deletion, and Correction' : 'Auskunft, Löschung und Berichtigung'}
          </h3>
          <p>
            {isEnglish
              ? 'Within the framework of the applicable legal provisions, you have the right to free information about your stored personal data, its origin and recipient, and the purpose of data processing and, if applicable, a right to correction or deletion of this data at any time. For this purpose and for further questions on the subject of personal data, you can contact us at any time at the address given in the '
              : 'Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im '}
            <a href="/imprint" className="underline hover:text-gray-300">
              {isEnglish ? 'Imprint' : 'Impressum'}
            </a>
            {isEnglish ? '.' : ' angegebenen Adresse an uns wenden.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Right to Restriction of Processing' : 'Recht auf Einschränkung der Verarbeitung'}
          </h3>
          <p>
            {isEnglish
              ? 'You have the right to request the restriction of processing of your personal data. For this purpose, you can contact us at any time at the address given in the '
              : 'Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit unter der im '}
            <a href="/imprint" className="underline hover:text-gray-300">
              {isEnglish ? 'Imprint' : 'Impressum'}
            </a>
            {isEnglish
              ? '. The right to restriction of processing exists in the following cases:'
              : ' angegebenen Adresse an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:'}
          </p>
          <ul>
            <li>
              {isEnglish
                ? 'If you dispute the accuracy of your personal data stored with us, we usually need time to verify this. For the duration of the verification, you have the right to request the restriction of processing of your personal data.'
                : 'Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.'}
            </li>
            <li>
              {isEnglish
                ? 'If the processing of your personal data happened/is happening unlawfully, you can request the restriction of data processing instead of deletion.'
                : 'Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.'}
            </li>
            <li>
              {isEnglish
                ? 'If we no longer need your personal data, but you need it to exercise, defend, or assert legal claims, you have the right to request the restriction of processing of your personal data instead of deletion.'
                : 'Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.'}
            </li>
            <li>
              {isEnglish
                ? 'If you have lodged an objection pursuant to Art. 21 para. 1 GDPR, a balancing of interests between your and our interests must be carried out. As long as it has not yet been determined whose interests prevail, you have the right to request the restriction of processing of your personal data.'
                : 'Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.'}
            </li>
          </ul>
          <p>
            {isEnglish
              ? 'If you have restricted the processing of your personal data, this data may only be processed—apart from its storage—with your consent or for the assertion, exercise, or defense of legal claims or for the protection of the rights of another natural or legal person or for reasons of an important public interest of the European Union or a member state.'
              : 'Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Objection to Advertising Emails' : 'Widerspruch gegen Werbe-E-Mails'}
          </h3>
          <p>
            {isEnglish
              ? 'The use of contact data published within the framework of the imprint obligation for sending unsolicited advertising and information materials is hereby objected to. The operators of the pages expressly reserve the right to take legal action in the event of unsolicited sending of advertising information, such as spam emails.'
              : 'Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.'}
          </p>

          <h2 className="text-xl mt-6 mb-2">
            4. {isEnglish ? 'Data Collection on This Website' : 'Datenerfassung auf dieser Website'}
          </h2>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Server Log Files' : 'Server-Log-Dateien'}
          </h3>
          <p>
            {isEnglish
              ? 'The provider of the pages automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are:'
              : 'Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:'}
          </p>
          <ul>
            <li>{isEnglish ? 'Browser type and browser version' : 'Browsertyp und Browserversion'}</li>
            <li>{isEnglish ? 'Operating system used' : 'verwendetes Betriebssystem'}</li>
            <li>{isEnglish ? 'Referrer URL' : 'Referrer URL'}</li>
            <li>
              {isEnglish ? 'Hostname of the accessing computer' : 'Hostname des zugreifenden Rechners'}
            </li>
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
              : 'Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.'}
          </p>
          <p>
            {isEnglish
              ? 'The processing of this data is based on Art. 6 para. 1 lit. b GDPR if your request is related to the fulfillment of a contract or is necessary for the implementation of pre-contractual measures. In all other cases, the processing is based on our legitimate interest in the effective processing of the requests addressed to us (Art. 6 para. 1 lit. f GDPR) or on your consent (Art. 6 para. 1 lit. a GDPR) if this has been requested.'
              : 'Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde.'}
          </p>
          <p>
            {isEnglish
              ? 'The data you send to us via contact requests will remain with us until you request deletion, revoke your consent to storage, or the purpose for data storage no longer applies (e.g., after your request has been processed). Mandatory legal provisions—in particular statutory retention periods—remain unaffected.'
              : 'Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Profile Information' : 'Profilinformationen'}
          </h3>
          <p>
            {isEnglish
              ? 'The website operator stores profile data (names, email, and optionally student status and university) of all course participants to automatically support course execution and certificate creation (Art. 6 para. 1 lit. f GDPR).'
              : 'Der Websitebetreiber speichert Profildaten (Namen, Email sowie ggf. Studentenstatus und Uni) aller Kursteilnehmenden, um die Kursdurchführung und die Erstellung der Zertifikate automatisiert zu unterstützen (Art. 6 Abs. 1 lit. f DSGVO).'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish ? 'Course Participation Information' : 'Informationen zur Kursteilnahme'}
          </h3>
          <p>
            {isEnglish
              ? 'The website operator stores data on courses for which registered users have applied or participated, as well as related information about the fulfillment of the set performance criteria for the courses that are needed for certificate issuance (Art. 6 para. 1 lit. f GDPR).'
              : 'Der Websitebetreiber speichert Daten zu Kursen, für die sich registrierte Nutzer:innen beworben haben bzw. an denen sie teilgenommen haben sowie zugehörige Informationen über die Erfüllung der angesetzten Leistungskriterien für die Kurse, die zur Ausstellung der Zertifikate benötigt werden (Art. 6 Abs. 1 lit. f DSGVO).'}
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            {isEnglish
              ? 'Questionnaire Data for Evaluation and Further Development of the Course Program'
              : 'Fragebogendaten zur Evaluation und Weiterentwicklung des Kursprogramms'}
          </h3>
          <p>
            {isEnglish
              ? 'The website operator regularly sends questionnaires for the evaluation of course offerings in which users participate and may additionally send questionnaires that serve the general further development of the course offerings and the platform. The associated response data is stored and evaluated by the website operator (Art. 6 para. 1 lit. f GDPR).'
              : 'Der Websitebetreiber versendet regelmäßig Fragebögen zur Evaluation von Kursangeboten, an denen Nutzer:innen teilnehmen und kann zusätzlich Fragebögen versenden, die zur generellen Weiterentwicklung des Kursangebots und der Plattform dienen. Die zugehörigen Antwortdaten werden durch den Websitebetreiber gespeichert und ausgewertet (Art. 6 Abs. 1 lit. f DSGVO).'}
          </p>

          <h2 className="text-xl mt-6 mb-2">
            5. {isEnglish ? 'Registration and Application Data' : 'Registrierungs- und Bewerbungsdaten'}
          </h2>
          <p>
            {isEnglish
              ? 'For registration as well as for applications to paid or application-required offerings, we collect personal data through forms that are integrated within the EduHub platform.'
              : 'Für die Registrierung sowie für Bewerbungen zu kostenpflichtigen oder bewerbungspflichtigen Angeboten erheben wir personenbezogene Daten über Formulare, die innerhalb der Plattform EduHub eingebunden sind.'}
          </p>
          <p>
            {isEnglish
              ? 'For this purpose, we use the tool "Formbricks" from Formbricks GmbH. Formbricks is used exclusively as a technical service provider and data processor in accordance with Art. 28 GDPR.'
              : 'Hierfür setzen wir das Tool „Formbricks" der Formbricks GmbH ein. Formbricks wird ausschließlich als technischer Dienstleister und Auftragsverarbeiter gemäß Art. 28 DSGVO eingesetzt.'}
          </p>
          <p>
            {isEnglish
              ? 'The processing of data is carried out exclusively on our instructions and for the purpose of carrying out pre-contractual measures as well as fulfilling the contract.'
              : 'Die Verarbeitung der Daten erfolgt ausschließlich auf unsere Weisung und zum Zweck der Durchführung vorvertraglicher Maßnahmen sowie der Erfüllung des Vertrags.'}
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
            {isEnglish
              ? 'The legal basis is Art. 6 para. 1 lit. b GDPR.'
              : 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.'}
          </p>
          <p>
            {isEnglish ? 'Further information: ' : 'Weitere Informationen: '}
            <a href="https://formbricks.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
              https://formbricks.com/privacy
            </a>
          </p>

          <h2 className="text-xl mt-6 mb-2">
            6. {isEnglish ? 'Payment Processing' : 'Zahlungsabwicklung'}
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
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
              https://stripe.com/privacy
            </a>
          </p>

          <div className="mt-12 mb-8">
            <p className="text-sm text-gray-400">
              {isEnglish ? 'As of: January 30, 2026' : 'Stand: 30. Januar 2026'}
            </p>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default Privacy;
