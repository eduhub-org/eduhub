import Head from 'next/head';
import { FC } from 'react';
import { GetServerSideProps } from 'next';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';

type Props = { portal: PortalBranding };

/**
 * Terms and conditions for the StuJo job board.
 *
 * In-repo rather than on the marketing site so that the consent recorded in
 * JobPosting.termsAcceptedAt is provable: the process in
 * docs/LEGAL_DOCUMENTS.md recovers the accepted version with
 * `git log --until=<timestamp> -- <this file>`, which only works while the
 * document lives in git. Update the "Stand" date whenever the text changes.
 */
const Agb: FC<Props> = ({ portal }) => (
  <Layout portal={portal}>
    <Head>
      <title>AGB | {portal.title}</title>
    </Head>

    <div className="stujo-legal">
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für die Schaltung von Stellen-, Projekt- und
        Veranstaltungsangeboten (nachfolgend „Anzeigen“) auf dem Karrierenetzwerk StuJo, betrieben
        vom Campus Business Box e.V. (nachfolgend „CBB“).
      </p>
      <p>
        Inserenten können ausschließlich Unternehmer im Sinne des § 14 BGB, juristische Personen des
        öffentlichen Rechts oder öffentlich-rechtliche Sondervermögen sein. Ein Verbrauchervertrag im
        Sinne des § 310 Abs. 3 BGB kommt nicht zustande. Die Vorschriften über Fernabsatzverträge mit
        Verbrauchern, insbesondere das Widerrufsrecht nach § 312g BGB, finden keine Anwendung.
      </p>

      <h2>§ 2 Vertragsgegenstand</h2>
      <p>
        CBB stellt Inserenten die technische Infrastruktur zur Veröffentlichung von Anzeigen zur
        Verfügung. CBB wird nicht vermittelnd tätig und schuldet keinen Vermittlungserfolg,
        insbesondere nicht das Zustandekommen eines Arbeits-, Praktikums- oder Projektverhältnisses.
      </p>

      <h2>§ 3 Vertragsschluss</h2>
      <p>
        Der Inserent gibt die Anzeige selbstständig über das Online-Formular ein. Mit dem Absenden
        einer kostenpflichtigen Anzeige gibt er ein verbindliches Angebot auf Abschluss eines
        Schaltungsvertrages ab. Der Vertrag kommt mit erfolgreichem Abschluss des Zahlungsvorgangs
        zustande.
      </p>

      <h2>§ 4 Preise, Fälligkeit und Zahlungsweise</h2>
      <p>
        Es gelten die im Bestellvorgang angezeigten Preise. Alle Preise verstehen sich zuzüglich der
        gesetzlichen Umsatzsteuer.
      </p>
      <p>
        Kostenpflichtige Anzeigen werden im Wege der Vorkasse abgerechnet. Die Zahlungsabwicklung
        erfolgt über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.). Zur Verfügung
        stehen die im Bestellvorgang angezeigten Zahlungsarten.
      </p>
      <p>
        Bei Zahlungsarten mit verzögerter Gutschrift, etwa SEPA-Lastschrift, wird die Anzeige bereits
        vor Zahlungseingang veröffentlicht. Scheitert der Einzug, ist CBB berechtigt, die Anzeige
        unverzüglich offline zu nehmen.
      </p>

      <h2>§ 5 Elektronische Rechnungsstellung</h2>
      <p>
        Die Rechnungsstellung erfolgt elektronisch. Der Inserent stimmt zu, dass ihm Rechnungen
        ausschließlich in elektronischer Form übermittelt werden, insbesondere als PDF-Datei per
        E-Mail an die im Nutzerkonto hinterlegte Kontakt-E-Mail-Adresse sowie ergänzend über einen
        Zugriffslink auf das Rechnungsdokument.
      </p>
      <p>
        Der Inserent stellt sicher, dass die hinterlegte E-Mail-Adresse zutreffend und empfangsbereit
        ist. Ein Anspruch auf Übermittlung einer Papierrechnung besteht nicht. Die Zustimmung kann
        mit Wirkung für die Zukunft widerrufen werden.
      </p>

      <h2>§ 6 Laufzeit und Veröffentlichung</h2>
      <p>
        Anzeigen werden nach Vertragsschluss veröffentlicht und sind, soweit im Bestellvorgang nicht
        anders angegeben, acht Wochen sichtbar. Danach werden sie archiviert.
      </p>
      <p>
        Der Inserent kann seine Anzeige jederzeit vorzeitig über den Unternehmenszugang löschen. Ein
        Anspruch auf Erstattung für die verbleibende Laufzeit besteht in diesem Fall nicht.
      </p>

      <h2>§ 7 Pflichten des Inserenten</h2>
      <p>
        Der Inserent ist für den Inhalt seiner Anzeige verantwortlich. Er sichert zu, dass die Anzeige
        nicht gegen geltendes Recht verstößt, insbesondere nicht gegen das Allgemeine
        Gleichbehandlungsgesetz, und keine Rechte Dritter verletzt.
      </p>
      <p>
        CBB behält sich vor, Anzeigen ohne Angabe von Gründen abzulehnen oder zu entfernen. Ein
        Anspruch auf Veröffentlichung besteht nicht.
      </p>

      <h2>§ 8 Haftung</h2>
      <p>
        CBB übernimmt keine Haftung für den Inhalt der Anzeigen. Die Haftung ist auf Vorsatz und grobe
        Fahrlässigkeit beschränkt. Hiervon unberührt bleibt die Haftung für Schäden aus der Verletzung
        des Lebens, des Körpers oder der Gesundheit sowie die Haftung nach dem Produkthaftungsgesetz.
      </p>

      <h2>§ 9 Urheberrecht</h2>
      <p>
        Die Inhalte des Karrierenetzwerks sind urheberrechtlich geschützt. Eine Vervielfältigung oder
        Verwendung, insbesondere das systematische Auslesen von Anzeigen, bedarf der vorherigen
        schriftlichen Zustimmung von CBB.
      </p>

      <h2>§ 10 Datenschutz</h2>
      <p>
        Die vom Inserenten übermittelten Daten werden ausschließlich zur Abwicklung des Vertrages und
        zur Administration des Karrierenetzwerks verarbeitet und gespeichert. Einzelheiten regelt die
        Datenschutzerklärung.
      </p>

      <h2>§ 11 Externe Verweise</h2>
      <p>
        Für die Inhalte verlinkter externer Websites ist ausschließlich deren jeweiliger Anbieter
        verantwortlich.
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <p>Erfüllungsort und Gerichtsstand ist Kiel.</p>
      <p>
        Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen
        unberührt.
      </p>

      <p className="stujo-legal-date">Stand: 1. September 2026</p>
    </div>
  </Layout>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  return { props: { portal } };
};

export default Agb;
