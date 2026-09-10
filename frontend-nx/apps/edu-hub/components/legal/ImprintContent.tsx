import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';

/**
 * The imprint body, shared by the edu-hub and StuJo apps (StuJo reaches it
 * through the `@eduhub/*` alias). Campus Business Box e.V. is the Anbieter
 * (section 5 DDG) of both sites, so the same details apply to both -- a StuJo
 * campus edition adds context above this block but never replaces it.
 *
 * Chrome-free on purpose: each app supplies its own page frame, heading and
 * `<Head>`. Colours come from the `--eduhub-*` token classes, which StuJo
 * redefines to dark-on-light in its own `globals.css`.
 *
 * `privacyHref` differs per app (`/privacy` vs `/datenschutz`).
 * Process for changing this text: docs/LEGAL_DOCUMENTS.md.
 */
export const ImprintContent: FC<{ privacyHref: string }> = ({ privacyHref }) => {
  const isEnglish = useRouter().locale === 'en';

  return (
    <>
      <div className="flex flex-wrap">
        <div className="mt-4">
          <h2 className="text-2xl mb-2">{isEnglish ? 'Address' : 'Anschrift'}</h2>
          <address className="not-italic">
            <p>Campus Business Box e.V.</p>
            <p>Wissenschaftszentrum Kiel</p>
            <p>Fraunhoferstraße 13</p>
            <p>24118 Kiel</p>
          </address>
          <p className="italic mt-2">{isEnglish ? 'Phone' : 'Telefon'}</p>
          <p>0431.90894380</p>
          <p className="italic mt-2">Email</p>
          <p>
            <a href="mailto:edu@opencampus.sh">edu @ opencampus.sh</a>
          </p>
        </div>
        <div className="ml-12 mt-4">
          <h2 className="text-2xl mb-2">{isEnglish ? 'Board' : 'Vorstand'}</h2>
          <dl>
            <dt className="italic mt-2">{isEnglish ? '1st Chairman' : '1. Vorsitzender'}</dt>
            <dd>Harm Brand</dd>
            <dt className="italic mt-2">{isEnglish ? 'Board Member' : 'Beisitzer'}</dt>
            <dd>Alexander Ohrt</dd>
            <dt className="italic mt-2">{isEnglish ? 'Board Member' : 'Beisitzer'}</dt>
            <dd>Frederik Steinbock</dd>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <p>
          {isEnglish
            ? 'Information on the processing of your personal data can be found in our '
            : 'Informationen zur Verarbeitung deiner personenbezogenen Daten findest du in unserer '}
          <Link href={privacyHref} className="underline hover:text-label-secondary">
            {isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}
          </Link>
          .
        </p>
      </div>
    </>
  );
};
