import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import type { JobListItem } from '../lib/jobs';

// Pin the timezone so server (UTC) and client (local) render the same
// calendar day; otherwise timestamps near midnight UTC hydrate as off-by-one
// dates (React hydration mismatch).
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })
    : null;

/**
 * One job row, styled like the live /stellenangebote list: pink h3 title,
 * grey h4 company, grey bold h5 "Ort // Datum", rows separated by a dotted
 * rule (see .stujo-job-row).
 */
const JobCard: FC<{ job: JobListItem }> = ({ job }) => {
  const t = useTranslations('jobType');
  const date = formatDate(job.publishedAt);
  const meta = [job.location, date].filter(Boolean).join(' // ');
  return (
    <div className={`stujo-job-row${job.featured ? ' stujo-job-row--featured' : ''}`}>
      <div>
        <h3>
          <Link href={`/stellenangebote/${job.id}`}>{job.title}</Link>
        </h3>
        <h4>{job.Organization.name}</h4>
        {(meta || job.type) && (
          <h5>
            {meta}
            {meta ? ' // ' : ''}
            {t(job.type)}
          </h5>
        )}
      </div>
      {job.Organization.logo && (
        <img
          src={job.Organization.logo}
          alt={job.Organization.name}
          style={{ maxHeight: '3.5rem', maxWidth: '8rem', objectFit: 'contain' }}
        />
      )}
    </div>
  );
};

export default JobCard;
