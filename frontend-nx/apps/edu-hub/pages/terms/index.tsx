import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';

const Terms: FC = () => {
  const { locale } = useRouter();
  const isEnglish = locale === 'en';

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>
          {isEnglish ? 'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen'} | EduHub | opencampus.sh
        </title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <div className="flex flex-row text-white">
          <h1 className="text-4xl font-bold p-24 pl-12 pb-0">
            {isEnglish ? 'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen'}
          </h1>
        </div>

        <div className="ml-12 mr-10">
          <h2 className="text-2xl mt-6 mb-2">§ 1 {isEnglish ? 'Scope' : 'Geltungsbereich'}</h2>
          <p>
            {isEnglish
              ? 'These Terms and Conditions apply to all contracts between Campus Business Box e.V. (hereinafter "Provider") and consumers (§ 13 BGB) regarding paid educational and event offerings (e.g., courses, workshops, events) offered through the EduHub platform.'
              : 'Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen dem Campus Business Box e.V. (nachfolgend „Anbieter") und Verbraucher:innen (§ 13 BGB) über kostenpflichtige Bildungs- und Veranstaltungsangebote (z. B. Kurse, Workshops, Events), die über die Plattform EduHub angeboten werden.'}
          </p>
          <p>{isEnglish ? 'The offer is exclusively for consumers.' : 'Das Angebot richtet sich ausschließlich an Verbraucher.'}</p>

          <h2 className="text-2xl mt-6 mb-2">§ 2 {isEnglish ? 'Subject Matter' : 'Vertragsgegenstand'}</h2>
          <p>
            {isEnglish
              ? 'The subject matter is participation in the respective booked offering according to the service description on the platform.'
              : 'Vertragsgegenstand ist die Teilnahme an dem jeweils gebuchten Angebot gemäß der Leistungsbeschreibung auf der Plattform.'}
          </p>
          <p>
            {isEnglish
              ? 'Digital downloads or on-demand content are not part of the services.'
              : 'Digitale Downloads oder On-Demand-Inhalte sind nicht Bestandteil der Leistungen.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">§ 3 {isEnglish ? 'Contract Formation' : 'Vertragsschluss'}</h2>
          <p>
            {isEnglish
              ? 'The presentation of offerings does not constitute a legally binding offer.'
              : 'Die Darstellung der Angebote stellt kein rechtlich bindendes Angebot dar.'}
          </p>
          <p>
            {isEnglish
              ? 'Some offerings on the platform require an application. This means that an application is required before participation and the selection of participants is made by the provider.'
              : 'Einige Angebote auf der Plattform sind bewerbungspflichtig. Das bedeutet, dass vor der Teilnahme eine Bewerbung erforderlich ist und die Auswahl der Teilnehmenden durch den Anbieter erfolgt.'}
          </p>
          <p>
            {isEnglish
              ? 'For offerings that do not require an application, the contract is formed as soon as the booking process is completed. For paid offerings, payment must also be successfully initiated.'
              : 'Bei nicht bewerbungspflichtigen Angeboten kommt der Vertrag zustande, sobald der Buchungsprozess abgeschlossen ist. Bei kostenpflichtigen Angeboten muss zusätzlich die Zahlung erfolgreich ausgelöst worden sein.'}
          </p>
          <p>
            {isEnglish
              ? 'For offerings that require an application, an application is submitted first. The contract is only formed upon explicit confirmation of participation by the provider.'
              : 'Bei bewerbungspflichtigen Angeboten erfolgt zunächst eine Bewerbung. Der Vertrag kommt erst mit ausdrücklicher Teilnahmebestätigung durch den Anbieter zustande.'}
          </p>
          <p>
            {isEnglish
              ? 'After contract formation, the participant receives a confirmation email with all contract information as well as these Terms and Conditions in text form.'
              : 'Nach Vertragsschluss erhält der/die Teilnehmende eine Bestätigungs-E-Mail mit allen Vertragsinformationen sowie diesen AGB in Textform.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">
            § 4 {isEnglish ? 'Prices and Payment Terms' : 'Preise und Zahlungsbedingungen'}
          </h2>
          <p>
            {isEnglish
              ? 'All prices stated include statutory value-added tax.'
              : 'Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.'}
          </p>
          <p>
            {isEnglish
              ? 'Payment is due immediately upon contract formation.'
              : 'Die Zahlung ist unmittelbar mit Vertragsschluss fällig.'}
          </p>
          <p>
            {isEnglish
              ? 'Payment processing is handled through external payment service providers (e.g., Stripe).'
              : 'Die Zahlungsabwicklung erfolgt über externe Zahlungsdienstleister (z. B. Stripe).'}
          </p>
          <p>
            {isEnglish
              ? 'For paid offerings that require an application, the participation fee may already be collected as part of the application.'
              : 'Bei bewerbungspflichtigen, kostenpflichtigen Angeboten kann die Teilnahmegebühr bereits im Rahmen der Bewerbung erhoben werden.'}
          </p>
          <p>
            {isEnglish
              ? 'If the application is not considered, the fee already paid will be fully and immediately refunded to the original payment method used.'
              : 'Wird die Bewerbung nicht berücksichtigt, wird die bereits gezahlte Gebühr vollständig und unverzüglich auf das ursprünglich verwendete Zahlungsmittel zurückerstattet.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">
            § 5 {isEnglish ? 'Payment Processing & Third Parties' : 'Zahlungsabwicklung & Drittanbieter'}
          </h2>
          <p>
            {isEnglish
              ? 'The collection of registration, application, onboarding, and evaluation data is done through forms and surveys provided within the EduHub platform. For this purpose, the tool "Formbricks" is used as a technical service provider.'
              : 'Die Erhebung von Registrierungs-, Bewerbungs-, Onboarding- und Evaluationsdaten erfolgt über Formulare und Umfragen, die innerhalb der Plattform EduHub bereitgestellt werden. Hierfür wird das Tool „Formbricks" als technischer Dienstleister eingesetzt.'}
          </p>
          <p>
            {isEnglish
              ? 'Payment data is processed exclusively through certified payment service providers (e.g., Stripe).'
              : 'Zahlungsdaten werden ausschließlich über zertifizierte Zahlungsdienstleister (z. B. Stripe) verarbeitet.'}
          </p>
          <p>
            {isEnglish
              ? 'The provider does not have access to complete payment data (e.g., credit card numbers).'
              : 'Der Anbieter hat keinen Zugriff auf vollständige Zahlungsdaten (z. B. Kreditkartennummern).'}
          </p>
          <p>
            {isEnglish
              ? 'Further information can be found in the Privacy Policy.'
              : 'Weitere Informationen finden sich in der Datenschutzerklärung.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">§ 6 {isEnglish ? 'Right of Withdrawal' : 'Widerrufsrecht'}</h2>
          <p>
            {isEnglish
              ? 'Consumers have a statutory right of withdrawal of 14 days.'
              : 'Verbraucher:innen haben ein gesetzliches Widerrufsrecht von 14 Tagen.'}
          </p>
          <p>
            <strong>{isEnglish ? 'Withdrawal Instructions:' : 'Widerrufsbelehrung:'}</strong>
          </p>
          <p>
            {isEnglish
              ? 'You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period begins on the day of contract formation.'
              : 'Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beginnt mit dem Tag des Vertragsschlusses.'}
          </p>
          <p>
            {isEnglish
              ? 'To exercise your right of withdrawal, you must inform us (Campus Business Box e.V., Fraunhoferstraße 13, 24118 Kiel, Email: edu@opencampus.sh) by means of a clear statement (e.g., by email).'
              : 'Um dein Widerrufsrecht auszuüben, musst du uns (Campus Business Box e.V., Fraunhoferstraße 13, 24118 Kiel, E-Mail: edu@opencampus.sh) mittels einer eindeutigen Erklärung (z. B. per E-Mail) informieren.'}
          </p>
          <p>
            <strong>{isEnglish ? 'Expiration of the Right of Withdrawal:' : 'Erlöschen des Widerrufsrechts:'}</strong>
          </p>
          <p>
            {isEnglish
              ? 'The right of withdrawal expires prematurely if the event has been fully conducted or if you have expressly agreed that the provider may begin performance before the withdrawal period expires.'
              : 'Das Widerrufsrecht erlischt vorzeitig, wenn die Veranstaltung vollständig durchgeführt wurde oder wenn du ausdrücklich zugestimmt hast, dass der Anbieter vor Ablauf der Widerrufsfrist mit der Leistung beginnt.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">§ 7 {isEnglish ? 'Cancellation' : 'Stornierung'}</h2>
          <p>
            {isEnglish
              ? 'Free cancellation is possible up to 14 days before the start of the offering.'
              : 'Eine kostenfreie Stornierung ist bis 14 Tage vor Beginn des Angebots möglich.'}
          </p>
          <p>
            {isEnglish
              ? 'For later cancellations, there is no right to a refund unless there is an important reason (e.g., illness).'
              : 'Bei späterer Stornierung besteht kein Anspruch auf Rückerstattung, es sei denn, es liegt ein wichtiger Grund vor (z. B. Krankheit).'}
          </p>
          <p>
            {isEnglish
              ? 'If cancelled by the provider, the participation fee will be fully refunded.'
              : 'Bei Absage durch den Anbieter wird die Teilnahmegebühr vollständig erstattet.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">
            § 8 {isEnglish ? 'Participation & Exclusion' : 'Teilnahme & Ausschluss'}
          </h2>
          <p>
            {isEnglish
              ? 'Participants are required to observe organizational instructions and behave respectfully.'
              : 'Teilnehmende sind verpflichtet, die organisatorischen Hinweise zu beachten und sich respektvoll zu verhalten.'}
          </p>
          <p>
            {isEnglish
              ? 'In case of serious violations, exclusion may occur. There is no right to a refund in this case.'
              : 'Bei schwerwiegenden Verstößen kann ein Ausschluss erfolgen. Ein Anspruch auf Rückerstattung besteht in diesem Fall nicht.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">§ 9 {isEnglish ? 'Liability' : 'Haftung'}</h2>
          <p>
            {isEnglish
              ? 'The provider is liable without limitation for intent and gross negligence as well as for injury to life, body, or health.'
              : 'Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.'}
          </p>
          <p>
            {isEnglish
              ? 'For slight negligence, the provider is only liable for breach of essential contractual obligations and limited to foreseeable damage.'
              : 'Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren Schaden.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">§ 10 {isEnglish ? 'Data Protection' : 'Datenschutz'}</h2>
          <p>
            {isEnglish
              ? 'The processing of personal data is carried out in accordance with the '
              : 'Die Verarbeitung personenbezogener Daten erfolgt gemäß der '}
            <Link href="/privacy" className="underline hover:text-gray-300">
              {isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}
            </Link>
            {isEnglish
              ? ', which is an integral part of this contract.'
              : ', die integraler Bestandteil dieses Vertrags ist.'}
          </p>

          <h2 className="text-2xl mt-6 mb-2">
            § 11 {isEnglish ? 'Final Provisions' : 'Schlussbestimmungen'}
          </h2>
          <p>{isEnglish ? 'German law applies.' : 'Es gilt deutsches Recht.'}</p>
          <p>
            {isEnglish
              ? 'The place of jurisdiction is Kiel, insofar as legally permissible.'
              : 'Gerichtsstand ist Kiel, soweit gesetzlich zulässig.'}
          </p>
          <p>
            {isEnglish
              ? 'Should individual provisions be invalid, the validity of the remaining provisions shall remain unaffected.'
              : 'Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.'}
          </p>

          <div className="mt-12 mb-8">
            <p className="text-sm text-gray-400">
              {isEnglish ? 'As of: February 5, 2026' : 'Stand: 5. Februar 2026'}
            </p>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default Terms;
