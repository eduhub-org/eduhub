import { FC } from 'react';
import { useRouter } from 'next/router';

import type { PortalBranding } from '../lib/portal';

/**
 * Context shown at the top of /impressum and /datenschutz.
 *
 * Campus Business Box e.V. runs every StuJo edition and is the Anbieter
 * (section 5 DDG) and the controller under the GDPR on all of them -- a
 * campus white-label does not change who provides the service. So this block
 * never replaces CBB's details; it only explains, on a campus edition, that
 * the university is a cooperation partner rather than the operator. The root
 * stujo.net edition gets the general paragraph alone.
 */
const SiteLegalNote: FC<{ portal: PortalBranding }> = ({ portal }) => {
  const isEnglish = useRouter().locale === 'en';
  const isCampusEdition = portal.slug !== 'stujo';

  return (
    <>
      <p>
        {isEnglish
          ? 'StuJo is the job board for students in Schleswig-Holstein. It is run by Campus Business Box e.V., whose details are given below. All StuJo editions draw on the same pool of job listings.'
          : 'StuJo ist die Stellenbörse für Studierende in Schleswig-Holstein. Betrieben wird sie vom Campus Business Box e.V., dessen Angaben unten stehen. Alle StuJo-Ausgaben greifen auf denselben Stellenpool zu.'}
      </p>
      {isCampusEdition && (
        <p>
          {isEnglish
            ? `"${portal.title}" is a university edition of that job board. It is provided by, and legally the responsibility of, Campus Business Box e.V. The university is a cooperation partner: it neither provides this site nor processes the data collected here.`
            : `„${portal.title}" ist eine Hochschul-Ausgabe dieser Stellenbörse. Anbieter und rechtlich verantwortlich für dieses Angebot ist der Campus Business Box e.V. Die Hochschule ist Kooperationspartnerin; sie stellt diese Seite nicht bereit und verarbeitet die hier erhobenen Daten nicht.`}
        </p>
      )}
    </>
  );
};

export default SiteLegalNote;
