import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import JobCard from '../../components/JobCard';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { fetchJobList, JobListItem } from '../../lib/jobs';
import { fetchAnonymous } from '../../lib/hasura';

type EnumOption = { value: string };

type Props = {
  portal: PortalBranding;
  jobs: JobListItem[];
  totalCount: number;
  types: EnumOption[];
  regions: EnumOption[];
  occupations: EnumOption[];
  filter: { type: string; region: string; occupation: string; search: string };
};

/**
 * Job list with the Rails filter dimensions: region (widened per the Rails
 * "region <=" semantics), type (category), occupation (Berufsfeld) and
 * free-text search over title + employer name.
 */
const JobList: FC<Props> = ({ portal, jobs, totalCount, types, regions, occupations, filter }) => {
  const t = useTranslations('common');
  const router = useRouter();

  const updateFilter = (patch: Record<string, string>) => {
    const query = Object.fromEntries(
      Object.entries({ ...filter, ...patch }).filter(([, v]) => v !== '')
    );
    router.push({ pathname: '/stellenangebote', query });
  };

  return (
    <Layout portal={portal}>
      <h1>{t('jobs')}</h1>
      <form
        className="stujo-filterbar"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          updateFilter({ search: String(data.get('search') || '') });
        }}
      >
        <select value={filter.region} onChange={(e) => updateFilter({ region: e.target.value })}>
          <option value="">{t('allRegions')}</option>
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.value}
            </option>
          ))}
        </select>
        <select value={filter.type} onChange={(e) => updateFilter({ type: e.target.value })}>
          <option value="">{t('allTypes')}</option>
          {types.map((c) => (
            <option key={c.value} value={c.value}>
              {c.value}
            </option>
          ))}
        </select>
        <select
          value={filter.occupation}
          onChange={(e) => updateFilter({ occupation: e.target.value })}
        >
          <option value="">{t('allOccupations')}</option>
          {occupations.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value}
            </option>
          ))}
        </select>
        <input name="search" defaultValue={filter.search} placeholder={t('search')} />
        <button type="submit">{t('search')}</button>
      </form>
      <p className="stujo-muted">{t('results', { count: totalCount })}</p>
      {jobs.length === 0 && <p>{t('noResults')}</p>}
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, query }) => {
  const portal = await resolvePortal(req.headers.host);
  const filter = {
    type: typeof query.type === 'string' ? query.type : '',
    region: typeof query.region === 'string' ? query.region : '',
    occupation: typeof query.occupation === 'string' ? query.occupation : '',
    search: typeof query.search === 'string' ? query.search : '',
  };

  const [{ jobs, totalCount }, enums] = await Promise.all([
    fetchJobList({
      type: filter.type || undefined,
      region: filter.region || undefined,
      occupation: filter.occupation || undefined,
      search: filter.search || undefined,
    }),
    fetchAnonymous<{
      JobPostingType: EnumOption[];
      JobRegion: EnumOption[];
      JobOccupation: EnumOption[];
    }>(/* GraphQL */ `
      query FilterOptions {
        JobPostingType {
          value
        }
        JobRegion {
          value
        }
        JobOccupation {
          value
        }
      }
    `),
  ]);

  return {
    props: {
      portal,
      jobs,
      totalCount,
      types: enums.JobPostingType,
      regions: enums.JobRegion,
      occupations: enums.JobOccupation,
      filter,
    },
  };
};

export default JobList;
