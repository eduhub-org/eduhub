import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { fetchJobDetail, JobDetail } from '../../lib/jobs';

type Props = { portal: PortalBranding; job: JobDetail };

const JobDetailPage: FC<Props> = ({ portal, job }) => {
  const t = useTranslations('common');
  return (
    <Layout portal={portal}>
      <Link href="/stellenangebote">← {t('backToList')}</Link>
      <h1>{job.title}</h1>
      <div className="stujo-muted">
        {job.customCompany || job.Organization.name}
        {job.location ? ` · ${job.location}` : ''}
      </div>
      <div style={{ margin: '0.5rem 0' }}>
        <span className="stujo-badge">{job.type}</span>
        <span className="stujo-badge">{job.occupation}</span>
        {job.region && <span className="stujo-badge">{job.region}</span>}
      </div>
      <dl>
        {job.salaryText && (
          <>
            <dt>{t('salary')}</dt>
            <dd>{job.salaryText}</dd>
          </>
        )}
        {job.startText && (
          <>
            <dt>{t('start')}</dt>
            <dd>{job.startText}</dd>
          </>
        )}
        {job.durationText && (
          <>
            <dt>{t('duration')}</dt>
            <dd>{job.durationText}</dd>
          </>
        )}
        {job.hoursPerWeek != null && (
          <>
            <dt>{t('hoursPerWeek')}</dt>
            <dd>{job.hoursPerWeek}</dd>
          </>
        )}
        {job.applicationDeadline && (
          <>
            <dt>{t('deadline')}</dt>
            <dd>{job.applicationDeadline}</dd>
          </>
        )}
      </dl>
      {job.description && <div dangerouslySetInnerHTML={{ __html: job.description }} />}
      {job.requirement && (
        <>
          <h2>{t('requirements')}</h2>
          <div dangerouslySetInnerHTML={{ __html: job.requirement }} />
        </>
      )}
      {job.pdfUrl && (
        <p>
          <a href={job.pdfUrl} target="_blank" rel="noreferrer">
            {t('downloadPdf')}
          </a>
        </p>
      )}
      <h2>{t('aboutEmployer')}</h2>
      <p>
        {job.Organization.name}
        {job.Organization.city ? `, ${job.Organization.city}` : ''}{' '}
        {job.Organization.website && (
          <a href={job.Organization.website} target="_blank" rel="noreferrer">
            {job.Organization.website}
          </a>
        )}
      </p>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, params }) => {
  const id = Number(params?.id);
  if (!Number.isInteger(id)) {
    return { notFound: true };
  }
  const [portal, job] = await Promise.all([resolvePortal(req.headers.host), fetchJobDetail(id)]);
  if (!job) {
    return { notFound: true };
  }
  return { props: { portal, job } };
};

export default JobDetailPage;
