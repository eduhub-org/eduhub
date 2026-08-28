import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import JobCard from '../../components/JobCard';
import StuJoLegacyIcon from '../../components/StuJoLegacyIcon';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { fetchJobList, JobListItem } from '../../lib/jobs';
import { fetchAnonymous } from '../../lib/hasura';

type EnumOption = { value: string };

const PAGE_SIZE = 20;

type Props = {
  portal: PortalBranding;
  jobs: JobListItem[];
  totalCount: number;
  types: EnumOption[];
  regions: EnumOption[];
  occupations: EnumOption[];
  filter: { type: string; region: string; occupation: string; search: string };
  page: number;
};

/**
 * Job list with the Rails filter dimensions: region (widened per the Rails
 * "region <=" semantics), type (category), occupation (Berufsfeld) and
 * free-text search over title + employer name. Filters sit in the purple
 * gradient band like on the live site; results are paginated.
 */
const JobList: FC<Props> = ({
  portal,
  jobs,
  totalCount,
  types,
  regions,
  occupations,
  filter,
  page,
}) => {
  const t = useTranslations('common');
  const tType = useTranslations('jobType');
  const tRegion = useTranslations('jobRegion');
  const tOccupation = useTranslations('jobOccupation');
  const router = useRouter();

  const updateFilter = (patch: Record<string, string>) => {
    const query = Object.fromEntries(
      Object.entries({ ...filter, ...patch }).filter(([, v]) => v !== '')
    );
    router.push({ pathname: '/stellenangebote', query });
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <Layout portal={portal} fullWidthMain>
      <section className="stujo-filterband">
        <div className="stujo-container">
          <form
            className="stujo-filterbar"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              updateFilter({ search: String(data.get('search') || ''), page: '' });
            }}
          >
            <div className="stujo-filter-search">
              <input
                name="search"
                defaultValue={filter.search}
                placeholder={t('searchPlaceholder')}
              />
              <button type="submit" aria-label={t('search')}>
                <StuJoLegacyIcon name="search" className="stujo-filter-search-icon" />
              </button>
            </div>
            <select
              value={filter.type}
              onChange={(e) => updateFilter({ type: e.target.value, page: '' })}
            >
              <option value="">{t('categoryPrompt')}</option>
              {types.map((c) => (
                <option key={c.value} value={c.value}>
                  {tType(c.value)}
                </option>
              ))}
            </select>
            <select
              value={filter.region}
              onChange={(e) => updateFilter({ region: e.target.value, page: '' })}
            >
              <option value="">{t('regionPrompt')}</option>
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {tRegion(r.value)}
                </option>
              ))}
            </select>
            <select
              value={filter.occupation}
              onChange={(e) => updateFilter({ occupation: e.target.value, page: '' })}
            >
              <option value="">{t('occupationPrompt')}</option>
              {occupations.map((o) => (
                <option key={o.value} value={o.value}>
                  {tOccupation(o.value)}
                </option>
              ))}
            </select>
          </form>
        </div>
      </section>

      <section className="stujo-container stujo-results">
        <h3>{t('availableOffers', { count: totalCount })}</h3>
        {jobs.length === 0 && <p>{t('noResults')}</p>}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {pageCount > 1 && (
          <p style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {page > 1 && (
              <button className="stujo-btn" onClick={() => updateFilter({ page: String(page - 1) })}>
                ‹
              </button>
            )}
            <span style={{ alignSelf: 'center' }}>
              {page} / {pageCount}
            </span>
            {page < pageCount && (
              <button className="stujo-btn" onClick={() => updateFilter({ page: String(page + 1) })}>
                ›
              </button>
            )}
          </p>
        )}
      </section>
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
  const page = Math.max(1, Number(typeof query.page === 'string' ? query.page : '1') || 1);

  const [{ jobs, totalCount }, enums] = await Promise.all([
    fetchJobList({
      type: filter.type || undefined,
      region: filter.region || undefined,
      occupation: filter.occupation || undefined,
      search: filter.search || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
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
      page,
    },
  };
};

export default JobList;
