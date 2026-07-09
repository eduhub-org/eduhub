import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { fetchJobList, JobListItem } from '../lib/jobs';

type Props = {
  portal: PortalBranding;
  jobs: JobListItem[];
  totalCount: number;
};

/**
 * Portal landing page: branded hero + latest published postings, with the
 * portal's default region preset (Flensburg portal shows Flensburg jobs
 * first — parity with the Rails landing pages).
 */
const Home: FC<Props> = ({ portal, jobs, totalCount }) => {
  const t = useTranslations('common');
  return (
    <Layout portal={portal}>
      <h1>{portal.title}</h1>
      <p className="stujo-muted">{t('results', { count: totalCount })}</p>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      <p>
        <Link href="/stellenangebote">{t('jobs')} →</Link>
      </p>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  const { jobs, totalCount } = await fetchJobList({
    region: portal.defaultRegion ?? undefined,
    limit: 10,
  });
  return { props: { portal, jobs, totalCount } };
};

export default Home;
