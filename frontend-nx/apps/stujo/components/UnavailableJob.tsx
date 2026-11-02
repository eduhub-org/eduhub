import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import type { JobListItem, UnavailableJob as UnavailableJobData } from '../lib/jobs';
import JobCard from './JobCard';

type Props = UnavailableJobData & { similarJobs: JobListItem[] };

/**
 * Shown instead of a job detail page when the posting is no longer public:
 * why it is gone, which posting it was (only if it was public once) and open
 * offers to continue with. Props only and no router access, so it can be
 * rendered unchanged from an App Router page or not-found.tsx later.
 */
const UnavailableJob: FC<Props> = ({ reason, job, similarJobs }) => {
  const t = useTranslations('unavailableJob');
  const tCommon = useTranslations('common');

  return (
    <>
      <Link href="/stellenangebote">← {tCommon('backToList')}</Link>
      <h2 style={{ marginBottom: 0 }}>{t(`${reason}Title`)}</h2>
      {job && (
        <h4 style={{ marginTop: '0.2em' }}>
          {t('jobByCompany', { title: job.title, company: job.company })}
        </h4>
      )}
      <p>{t(`${reason}Text`)}</p>

      {similarJobs.length > 0 && (
        <>
          <h3>{t('similarJobs')}</h3>
          {similarJobs.map((similar) => (
            <JobCard key={similar.id} job={similar} />
          ))}
        </>
      )}
      <p>
        <Link href="/stellenangebote" className="stujo-btn">
          {tCommon('allOffers')}
        </Link>
      </p>
    </>
  );
};

export default UnavailableJob;
