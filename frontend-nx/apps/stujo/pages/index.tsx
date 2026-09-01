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
 * Portal landing page, ported from the live university landing
 * (partials/_university_landing.scss): purple gradient band with the green
 * "STUJO.NET - DAS KARRIEREPORTAL" headline and white intro copy, followed
 * by the latest published postings (with the portal's default region
 * preset — parity with the Rails landing pages, e.g. Flensburg).
 */
const Home: FC<Props> = ({ portal, jobs, totalCount }) => {
  const t = useTranslations('common');
  return (
    <Layout portal={portal} fullWidthMain>
      <section className="stujo-hero">
        <div className="stujo-container">
          <div className="stujo-hero-content">
            <h1 className="stujo-hero-claim">{t('heroTitle')}</h1>
            <p className="stujo-hero-sub">{t('heroText')}</p>
            <p className="stujo-hero-sub stujo-hero-tagline">{t('heroClaim')}</p>
          </div>
        </div>
      </section>

      <section className="stujo-container stujo-landing-cols">
        <div>
          <h2 className="stujo-landing-head">{t('latestOffers').toUpperCase()}</h2>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/stellenangebote" className="stujo-btn">
              {t('allOffers')}
            </Link>
          </p>
        </div>
        <div>
          <h2 className="stujo-landing-head">{t('availableOffers', { count: totalCount })}</h2>
          <p>
            <img src="/stujo_bird.png" alt="StuJo" style={{ maxWidth: '10rem' }} />
          </p>
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  const { jobs, totalCount } = await fetchJobList({
    region: portal.defaultRegion ?? undefined,
    limit: 5,
  });
  return { props: { portal, jobs, totalCount } };
};

export default Home;
