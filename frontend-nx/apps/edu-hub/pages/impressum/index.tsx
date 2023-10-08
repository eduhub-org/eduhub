import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../components/Page';

const Impressum: FC = () => {
  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <div className="flex flex-row text-white">
          <h1 className="text-4xl font-bold p-24 pl-12 pb-0">Impressum</h1>
        </div>

        <div className="flex flex-wrap">
          <div className="ml-12 mr-10 mt-4">
            <h2 className="text-2xl mb-2">Anschrift</h2>
            <dd>Campusbusinessbox e.V.</dd>
            <dd>Wissenschaftszentrum Kiel</dd>
            <dd>Fraunhoferstraße 13</dd>
            <dd>24118 Kiel</dd>
            <dt className="italic mt-2">Telefon</dt>
            <dd>0431.90894380</dd>
            <dt className="italic mt-2">Email</dt>
            <a href="mailto:team@opencampus.sh">team @ opencampus.sh</a>
          </div>
          <div className="ml-12 mr-10 mt-4">
            <h2 className="text-2xl mb-2">Vorstand</h2>
            <dt className="italic mt-2">1. Vorsitzender</dt>
            <dd>Harm Brand</dd>
            <dt className="italic mt-2">Beisitzer</dt>
            <dd>Alexander Ohrt</dd>
            <dt className="italic mt-2">Beisitzer</dt>
            <dd>Frederik Steinbock</dd>
          </div>
          <div className="col-0 col-md-1"></div>
        </div>

        <div className="ml-12 mr-10">
          <h2 className="text-2xl mt-12 mb-2">Datenschutzerklärung</h2>
          <h2 className="text-xl mt-6 mb-2">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-lg mt-2 mb-2 italic">Allgemeine Hinweise</h3>{' '}
          <p>
            Die folgenden Hinweise geben einen einfachen &Uuml;berblick dar&uuml;ber, was mit Ihren personenbezogenen
            Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            pers&ouml;nlich identifiziert werden k&ouml;nnen. Ausf&uuml;hrliche Informationen zum Thema Datenschutz
            entnehmen Sie unserer unter diesem Text aufgef&uuml;hrten Datenschutzerkl&auml;rung.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Datenerfassung auf dieser Website</h3>{' '}
          <p>
            <strong>Wer ist verantwortlich f&uuml;r die Datenerfassung auf dieser Website?</strong>
          </p>{' '}
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Campus Business Box e.V., Fraunhoferstr. 13,
            24118 Kiel.
          </p>{' '}
          <p>
            <strong>Wie erfassen wir Ihre Daten?</strong>
          </p>{' '}
          <p>
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B.
            um Daten handeln, die Sie in ein Kontaktformular eingeben.
          </p>{' '}
          <p>
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme
            erfasst. Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des
            Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
          </p>{' '}
          <p>
            <strong>Wof&uuml;r nutzen wir Ihre Daten?</strong>
          </p>{' '}
          <p>
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gew&auml;hrleisten.
            Andere Daten k&ouml;nnen zur Analyse Ihres Nutzerverhaltens verwendet werden.
          </p>{' '}
          <p>
            <strong>Welche Rechte haben Sie bez&uuml;glich Ihrer Daten?</strong>
          </p>{' '}
          <p>
            Sie haben jederzeit das Recht unentgeltlich Auskunft &uuml;ber Herkunft, Empf&auml;nger und Zweck Ihrer
            gespeicherten personenbezogenen Daten zu erhalten. Sie haben au&szlig;erdem ein Recht, die Berichtigung oder
            L&ouml;schung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben,
            k&ouml;nnen Sie diese Einwilligung jederzeit f&uuml;r die Zukunft widerrufen. Au&szlig;erdem haben Sie das
            Recht, unter bestimmten Umst&auml;nden die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten
            zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde
            zu.
          </p>{' '}
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema Datenschutz k&ouml;nnen Sie sich jederzeit unter der im Impressum
            angegebenen Adresse an uns wenden.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Analyse-Tools und Tools von Drittanbietern</h3>{' '}
          <p>
            Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem
            mit Cookies und mit sogenannten Analyseprogrammen.
          </p>{' '}
          <p>
            Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden
            Datenschutzerkl&auml;rung.
          </p>
          <h2 className="text-xl mt-6 mb-2">2. Hosting und Content Delivery Networks (CDN)</h2>
          <h3>Externes Hosting</h3>{' '}
          <p>
            Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf
            dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um
            IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen,
            Webseitenzugriffe und sonstige Daten, die &uuml;ber eine Website generiert werden, handeln.
          </p>{' '}
          <p>
            Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserf&uuml;llung gegen&uuml;ber unseren potenziellen
            und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und
            effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit.
            f DSGVO).
          </p>{' '}
          <p>
            Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erf&uuml;llung seiner Leistungspflichten
            erforderlich ist und unsere Weisungen in Bezug auf diese Daten befolgen.
          </p>
          <h2 className="text-xl mt-6 mb-2">3. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3 className="text-lg mt-2 mb-2 italic">Datenschutz</h3>{' '}
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer pers&ouml;nlichen Daten sehr ernst. Wir behandeln Ihre
            personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser
            Datenschutzerkl&auml;rung.
          </p>{' '}
          <p>
            Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten
            sind Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen. Die vorliegende
            Datenschutzerkl&auml;rung erl&auml;utert, welche Daten wir erheben und wof&uuml;r wir sie nutzen. Sie
            erl&auml;utert auch, wie und zu welchem Zweck das geschieht.
          </p>{' '}
          <p>
            Wir weisen darauf hin, dass die Daten&uuml;bertragung im Internet (z.&nbsp;B. bei der Kommunikation per
            E-Mail) Sicherheitsl&uuml;cken aufweisen kann. Ein l&uuml;ckenloser Schutz der Daten vor dem Zugriff durch
            Dritte ist nicht m&ouml;glich.
          </p>
          <h3>Hinweis zur verantwortlichen Stelle</h3>{' '}
          <p>Die verantwortliche Stelle f&uuml;r die Datenverarbeitung auf dieser Website ist:</p>{' '}
          <p>
            Campus Business Box e.V.
            <br />
            Fraunhoferstr. 13
            <br />
            24118 Kiel
          </p>
          <p>
            Telefon: +49 (0) 431 9089 4380
            <br />
            Email:
            <a href="mailto:team@opencampus.sh">team @ opencampus.sh</a>
          </p>{' '}
          <p>
            Verantwortliche Stelle ist die nat&uuml;rliche oder juristische Person, die allein oder gemeinsam mit
            anderen &uuml;ber die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen,
            E-Mail-Adressen o. &Auml;.) entscheidet.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>{' '}
          <p>
            Viele Datenverarbeitungsvorg&auml;nge sind nur mit Ihrer ausdr&uuml;cklichen Einwilligung m&ouml;glich. Sie
            k&ouml;nnen eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung
            per E-Mail an uns. Die Rechtm&auml;&szlig;igkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom
            Widerruf unber&uuml;hrt.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            Widerspruchsrecht gegen die Datenerhebung in besonderen F&auml;llen sowie gegen Direktwerbung (Art. 21
            DSGVO)
          </h3>{' '}
          <p>
            WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT
            DAS RECHT, AUS GR&Uuml;NDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER
            PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH F&Uuml;R EIN AUF DIESE BESTIMMUNGEN
            GEST&Uuml;TZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE
            DIESER DATENSCHUTZERKL&Auml;RUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN
            PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR K&Ouml;NNEN ZWINGENDE SCHUTZW&Uuml;RDIGE
            GR&Uuml;NDE F&Uuml;R DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN &Uuml;BERWIEGEN
            ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUS&Uuml;BUNG ODER VERTEIDIGUNG VON RECHTSANSPR&Uuml;CHEN
            (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).
          </p>{' '}
          <p>
            WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT,
            JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER
            WERBUNG EINZULEGEN; DIES GILT AUCH F&Uuml;R DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG
            STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER
            DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde</h3>{' '}
          <p>
            Im Falle von Verst&ouml;&szlig;en gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer
            Aufsichtsbeh&ouml;rde, insbesondere in dem Mitgliedstaat ihres gew&ouml;hnlichen Aufenthalts, ihres
            Arbeitsplatzes oder des Orts des mutma&szlig;lichen Versto&szlig;es zu. Das Beschwerderecht besteht
            unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Recht auf Daten&uuml;bertragbarkeit</h3>{' '}
          <p>
            Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erf&uuml;llung eines Vertrags
            automatisiert verarbeiten, an sich oder an einen Dritten in einem g&auml;ngigen, maschinenlesbaren Format
            aush&auml;ndigen zu lassen. Sofern Sie die direkte &Uuml;bertragung der Daten an einen anderen
            Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">SSL- bzw. TLS-Verschl&uuml;sselung</h3>{' '}
          <p>
            Diese Seite nutzt aus Sicherheitsgr&uuml;nden und zum Schutz der &Uuml;bertragung vertraulicher Inhalte, wie
            zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw.
            TLS-Verschl&uuml;sselung. Eine verschl&uuml;sselte Verbindung erkennen Sie daran, dass die Adresszeile des
            Browsers von &bdquo;http://&ldquo; auf &bdquo;https://&ldquo; wechselt und an dem Schloss-Symbol in Ihrer
            Browserzeile.
          </p>{' '}
          <p>
            Wenn die SSL- bzw. TLS-Verschl&uuml;sselung aktiviert ist, k&ouml;nnen die Daten, die Sie an uns
            &uuml;bermitteln, nicht von Dritten mitgelesen werden.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Auskunft, L&ouml;schung und Berichtigung</h3>{' '}
          <p>
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft
            &uuml;ber Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empf&auml;nger und den Zweck der
            Datenverarbeitung und ggf. ein Recht auf Berichtigung oder L&ouml;schung dieser Daten. Hierzu sowie zu
            weiteren Fragen zum Thema personenbezogene Daten k&ouml;nnen Sie sich jederzeit unter der im Impressum
            angegebenen Adresse an uns wenden.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Recht auf Einschr&auml;nkung der Verarbeitung</h3>{' '}
          <p>
            Sie haben das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            Hierzu k&ouml;nnen Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Das Recht
            auf Einschr&auml;nkung der Verarbeitung besteht in folgenden F&auml;llen:
          </p>{' '}
          <ul>
            {' '}
            <li>
              Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, ben&ouml;tigen
              wir in der Regel Zeit, um dies zu &uuml;berpr&uuml;fen. F&uuml;r die Dauer der Pr&uuml;fung haben Sie das
              Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            </li>{' '}
            <li>
              Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtm&auml;&szlig;ig geschah/geschieht, k&ouml;nnen
              Sie statt der L&ouml;schung die Einschr&auml;nkung der Datenverarbeitung verlangen.
            </li>{' '}
            <li>
              Wenn wir Ihre personenbezogenen Daten nicht mehr ben&ouml;tigen, Sie sie jedoch zur Aus&uuml;bung,
              Verteidigung oder Geltendmachung von Rechtsanspr&uuml;chen ben&ouml;tigen, haben Sie das Recht, statt der
              L&ouml;schung die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            </li>{' '}
            <li>
              Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abw&auml;gung zwischen
              Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen
              &uuml;berwiegen, haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen
              Daten zu verlangen.
            </li>{' '}
          </ul>{' '}
          <p>
            Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschr&auml;nkt haben, d&uuml;rfen diese Daten
            &ndash; von ihrer Speicherung abgesehen &ndash; nur mit Ihrer Einwilligung oder zur Geltendmachung,
            Aus&uuml;bung oder Verteidigung von Rechtsanspr&uuml;chen oder zum Schutz der Rechte einer anderen
            nat&uuml;rlichen oder juristischen Person oder aus Gr&uuml;nden eines wichtigen &ouml;ffentlichen Interesses
            der Europ&auml;ischen Union oder eines Mitgliedstaats verarbeitet werden.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Widerspruch gegen Werbe-E-Mails</h3>{' '}
          <p>
            Der Nutzung von im Rahmen der Impressumspflicht ver&ouml;ffentlichten Kontaktdaten zur &Uuml;bersendung von
            nicht ausdr&uuml;cklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die
            Betreiber der Seiten behalten sich ausdr&uuml;cklich rechtliche Schritte im Falle der unverlangten Zusendung
            von Werbeinformationen, etwa durch Spam-E-Mails, vor.
          </p>
          <h2 className="text-xl mt-6 mb-2">4. Datenerfassung auf dieser Website</h2>
          <h3 className="text-lg mt-2 mb-2 italic">Server-Log-Dateien</h3>{' '}
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien,
            die Ihr Browser automatisch an uns &uuml;bermittelt. Dies sind:
          </p>{' '}
          <ul>
            {' '}
            <li>Browsertyp und Browserversion</li> <li>verwendetes Betriebssystem</li> <li>Referrer URL</li>{' '}
            <li>Hostname des zugreifenden Rechners</li> <li>Uhrzeit der Serveranfrage</li> <li>IP-Adresse</li>{' '}
          </ul>{' '}
          <p>Eine Zusammenf&uuml;hrung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p>{' '}
          <p>
            Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat
            ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website
            &ndash; hierzu m&uuml;ssen die Server-Log-Files erfasst werden.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Anfrage per E-Mail, Telefon oder Telefax</h3>{' '}
          <p>
            Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus
            hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns
            gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
          </p>{' '}
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit
            der Erf&uuml;llung eines Vertrags zusammenh&auml;ngt oder zur Durchf&uuml;hrung vorvertraglicher
            Ma&szlig;nahmen erforderlich ist. In allen &uuml;brigen F&auml;llen beruht die Verarbeitung auf unserem
            berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f
            DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde.
          </p>{' '}
          <p>
            Die von Ihnen an uns per Kontaktanfragen &uuml;bersandten Daten verbleiben bei uns, bis Sie uns zur
            L&ouml;schung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck f&uuml;r die
            Datenspeicherung entf&auml;llt (z.&nbsp;B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende
            gesetzliche Bestimmungen &ndash; insbesondere gesetzliche Aufbewahrungsfristen &ndash; bleiben
            unber&uuml;hrt.
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Profilinformationen</h3>{' '}
          <p>
            Der Websitebetreiber speichert Profildaten (Namen, Email sowie ggf. Studentenstatus und Uni) aller
            Kursteilnehmenden, um die Kursdurchführung und die Erstellung der Zertifikate automatisiert zu unterstützen
            (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">Informationen zur Kursteilnahme</h3>{' '}
          <p>
            Der Websitebetreiber speichert Daten zu Kursen, für die sich registrierte Nutzer:innen beworben haben bzw.
            an denen sie teilgenommen haben sowie zugehörige Informationen über die Erfüllung der angesetzten
            Leistungskriterien für die Kurse, die zur Ausstellung der Zertifikate benötigt werden (Art. 6 Abs. 1 lit. f
            DSGVO).
          </p>
          <h3 className="text-lg mt-2 mb-2 italic">
            Fragebogendaten zur Evaluation und Weiterentwicklung des Kursprogramms
          </h3>{' '}
          <p>
            Der Websitebetreiber versendet regelmäßig Fragebögen zur Evaluation von Kursangeboten, an denen Nutzer:innen
            teilnehmen und kann zusätzlich Fragebögen versenden, die zur generellen Weiterentwicklung des Kursangebots
            und der Plattform dienen. Die zugehörigen Antwortdaten werden durch den Websitebetreiber gespeichert und
            ausgewertet (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </div>
      </Page>
    </div>
  );
};

export default Impressum;
