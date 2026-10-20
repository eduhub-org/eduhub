import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import UnavailableJob from '../../components/UnavailableJob';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { portalHost } from '../../lib/requestHost';
import {
  fetchJobDetail,
  fetchSimilarJobs,
  fetchUnavailableJob,
  JobDetail,
  JobListItem,
  UnavailableJob as UnavailableJobData,
} from '../../lib/jobs';
import { httpUrlOrNull, sanitizeHtml } from '../../lib/sanitizeHtml';

type Props =
  | { portal: PortalBranding; job: JobDetail }
  | {
      portal: PortalBranding;
      unavailable: UnavailableJobData;
      similarJobs: JobListItem[];
    };

// Legacy (ETL-imported) postings carry HTML like the Rails app rendered
// with `raw`; postings written through the plain-textarea form are plain
// text — render those escaped with preserved line breaks instead.
const RichText: FC<{ value: string }> = ({ value }) =>
  /<[a-z][^>]*>/i.test(value) ? (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
  ) : (
    <div style={{ whiteSpace: 'pre-line' }}>{value}</div>
  );

const JobDetailPage: FC<Props> = (props) =>
  'job' in props ? (
    <JobDetailView portal={props.portal} job={props.job} />
  ) : (
    <Layout portal={props.portal}>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <UnavailableJob {...props.unavailable} similarJobs={props.similarJobs} />
    </Layout>
  );

/**
 * Job detail, ported from the live /stellenangebot page: pink title +
 * grey company, company logo next to a bold-label/value fact grid
 * (Kategorie, Berufsfeld, Vergütung, Beginn, Arbeitsort, …), description,
 * and the job PDF embedded inline.
 */
const JobDetailView: FC<{ portal: PortalBranding; job: JobDetail }> = ({ portal, job }) => {
  const t = useTranslations('common');
  const tType = useTranslations('jobType');
  const tOccupation = useTranslations('jobOccupation');
  const tRegion = useTranslations('jobRegion');

  // Employer-supplied field: only ever link out to http(s) URLs.
  const website = httpUrlOrNull(job.Organization.website);

  const facts: [string, string | null][] = [
    [t('category'), tType(job.type)],
    [t('occupation'), job.occupation ? tOccupation(job.occupation) : null],
    [t('salary'), job.salaryText],
    [t('start'), job.startText],
    [t('duration'), job.durationText],
    [t('hoursPerWeek'), job.hoursPerWeek != null ? String(job.hoursPerWeek) : null],
    [t('location'), [job.location, job.region && tRegion(job.region)].filter(Boolean).join(', ')],
    [t('deadline'), job.applicationDeadline],
    [
      t('publishedAt'),
      job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('de-DE') : null,
    ],
  ];

  return (
    <Layout portal={portal}>
      <Link href="/stellenangebote">← {t('backToList')}</Link>
      <h2 style={{ marginBottom: 0 }}>{job.title}</h2>
      <h4 style={{ marginTop: '0.2em' }}>{job.customCompany || job.Organization.name}</h4>

      <div className="stujo-detail-grid">
        {job.Organization.logo && (
          <img
            src={job.Organization.logo}
            alt={job.Organization.name}
            className="stujo-detail-logo"
          />
        )}
        <dl className="stujo-detail-list">
          {facts.map(
            ([label, value]) =>
              value && (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              )
          )}
        </dl>
        <dl className="stujo-detail-list">
          <dt>{t('aboutEmployer')}</dt>
          <dd>
            {job.Organization.name}
            {job.Organization.city ? `, ${job.Organization.city}` : ''}
          </dd>
          {website && (
            <dd>
              <a href={website} target="_blank" rel="noreferrer">
                {website}
              </a>
            </dd>
          )}
        </dl>
      </div>

      {job.description && <RichText value={job.description} />}
      {job.requirement && (
        <>
          <h3>{t('requirements')}</h3>
          <RichText value={job.requirement} />
        </>
      )}
      {job.pdfUrl && (
        <>
          <embed src={job.pdfUrl} type="application/pdf" className="stujo-pdf-embed" />
          <p>
            <a href={job.pdfUrl} target="_blank" rel="noreferrer" className="stujo-btn">
              {t('downloadPdf')}
            </a>
          </p>
        </>
      )}
    </Layout>
  );
};

// A job that is not public (expired, deactivated, unknown, malformed id)
// still gets a branded page explaining why, but with HTTP 404 so search
// engines drop it. 404 rather than 410: expired postings can be re-posted
// under the same id. See docs/APP_ROUTER_MIGRATION_PLAN.md §5 for porting.
export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
  const id = Number(params?.id);
  // JobPosting.id is a Postgres integer; anything outside it would make
  // Hasura reject the query (a 500) rather than simply not match.
  const isValidId = Number.isInteger(id) && id > 0 && id <= 2_147_483_647;
  const [portal, job] = await Promise.all([
    resolvePortal(portalHost(req)),
    isValidId ? fetchJobDetail(id) : null,
  ]);
  if (job) {
    return { props: { portal, job } };
  }
  const unavailable: UnavailableJobData = isValidId
    ? await fetchUnavailableJob(id)
    : { reason: 'notFound', job: null };
  const similarJobs = unavailable.job ? await fetchSimilarJobs(unavailable.job) : [];
  res.statusCode = 404;
  return { props: { portal, unavailable, similarJobs } };
};

export default JobDetailPage;
