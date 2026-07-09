import Link from 'next/link';
import { FC } from 'react';

import type { JobListItem } from '../lib/jobs';

const JobCard: FC<{ job: JobListItem }> = ({ job }) => (
  <div className={`stujo-job-card${job.featured ? ' stujo-job-card--featured' : ''}`}>
    <div>
      <Link href={`/stellenangebote/${job.id}`} style={{ fontWeight: 600 }}>
        {job.title}
      </Link>
      <div className="stujo-muted">
        {job.Organization.name}
        {job.location ? ` · ${job.location}` : ''}
      </div>
      <div style={{ marginTop: '0.4rem' }}>
        <span className="stujo-badge">{job.type}</span>
        {job.region && <span className="stujo-badge">{job.region}</span>}
      </div>
    </div>
    {job.Organization.logo && (
      <img
        src={job.Organization.logo}
        alt={job.Organization.name}
        style={{ height: '3rem', objectFit: 'contain' }}
      />
    )}
  </div>
);

export default JobCard;
