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

const QUICK_FILTERS: [string, string][] = [
  ['WERKSTUDENT', 'WORKING_STUDENT'],
  ['PRAKTIKUM', 'INTERNSHIP'],
  ['ABSCHLUSSARBEIT', 'THESIS'],
  ['FESTANSTELLUNG', 'PERMANENT'],
  ['TRAINEE', 'TRAINEE'],
  ['MINIJOB', 'MINIJOB'],
];

/**
 * Portal landing page per design/stujo-design.pen: branded hero with
 * search and quick type filters, plus the latest published postings
 * (with the portal's default region preset — parity with the Rails
 * landing pages, e.g. Flensburg).
 */
const Home: FC<Props> = ({ portal, jobs, totalCount }) => {
  const t = useTranslations('common');
  return (
    <Layout portal={portal}>
      <section className="stujo-hero">
        <img src="/stujo_bird.png" alt="" className="stujo-hero-bird" />
        <h1 className="stujo-hero-claim">Finde Deinen Studentenjob in Schleswig-Holstein</h1>
        <p className="stujo-hero-sub">
          Werkstudentenjobs, Praktika, Abschlussarbeiten und Festanstellungen – direkt von
          Arbeitgebern aus der Region.
        </p>
        <form className="stujo-hero-search" action="/stellenangebote" method="get">
          <input name="search" placeholder="Jobtitel, Firma oder Stichwort …" />
          <button type="submit">{t('search')}</button>
        </form>
        <div className="stujo-hero-filters">
          {QUICK_FILTERS.map(([label, type]) => (
            <Link key={type} href={`/stellenangebote?type=${type}`} className="stujo-badge-link">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="stujo-section-head">
          <h2>Neueste Stellenangebote</h2>
          <span className="stujo-muted">{t('results', { count: totalCount })}</span>
        </div>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        <p style={{ textAlign: 'center' }}>
          <Link href="/stellenangebote" className="stujo-btn stujo-btn--ghost">
            Alle Stellenangebote ansehen
          </Link>
        </p>
      </section>
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
