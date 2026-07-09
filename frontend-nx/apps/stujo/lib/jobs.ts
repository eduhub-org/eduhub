import { fetchAnonymous } from './hasura';

/**
 * Anonymous job queries for the public pages. Hasura's `anonymous` role
 * already filters to PUBLISHED, non-expired, unrestricted postings, so the
 * queries stay simple. Region search keeps the Rails semantics: KIEL is a
 * subset of SCHLESWIG_HOLSTEIN_HAMBURG (see JobRegion table comment).
 */

export type JobListItem = {
  id: number;
  slug: string | null;
  title: string;
  type: string;
  region: string | null;
  occupation: string;
  location: string | null;
  featured: boolean;
  publishedAt: string | null;
  Organization: { id: number; name: string; logo: string | null };
};

export type JobDetail = JobListItem & {
  description: string | null;
  shortDescription: string | null;
  requirement: string | null;
  salaryText: string | null;
  startText: string | null;
  durationText: string | null;
  applicationDeadline: string | null;
  workExperienceRequired: boolean;
  hoursPerWeek: number | null;
  language: string | null;
  international: boolean;
  internationalDescription: string | null;
  customCompany: string | null;
  pdfUrl: string | null;
  JobPostingTags: { name: string }[];
  Organization: {
    id: number;
    name: string;
    logo: string | null;
    description: string | null;
    website: string | null;
    city: string | null;
  };
};

export type JobFilter = {
  type?: string;
  region?: string;
  occupation?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

// Rails `defaultsearch` widens Kiel to also match SH+HH scope-wise; here we
// interpret a region filter as "job is available in/around this region".
const REGION_WIDENING: Record<string, string[]> = {
  KIEL: ['KIEL', 'SCHLESWIG_HOLSTEIN_HAMBURG', 'GERMANY'],
  FLENSBURG: ['FLENSBURG', 'SCHLESWIG_HOLSTEIN_HAMBURG', 'GERMANY'],
  SCHLESWIG_HOLSTEIN_HAMBURG: ['SCHLESWIG_HOLSTEIN_HAMBURG', 'GERMANY'],
};

const LIST_FIELDS = /* GraphQL */ `
  id
  slug
  title
  type
  region
  occupation
  location
  featured
  publishedAt
  Organization {
    id
    name
    logo
  }
`;

export async function fetchJobList(filter: JobFilter = {}): Promise<{
  jobs: JobListItem[];
  totalCount: number;
}> {
  const conditions: string[] = [];
  const variables: Record<string, unknown> = {
    limit: filter.limit ?? 20,
    offset: filter.offset ?? 0,
  };

  if (filter.type) {
    conditions.push('{type: {_eq: $type}}');
    variables.type = filter.type;
  }
  if (filter.region) {
    conditions.push('{region: {_in: $regions}}');
    variables.regions = REGION_WIDENING[filter.region] ?? [filter.region];
  }
  if (filter.occupation) {
    conditions.push('{occupation: {_eq: $occupation}}');
    variables.occupation = filter.occupation;
  }
  if (filter.search) {
    conditions.push(
      '{_or: [{title: {_ilike: $search}}, {Organization: {name: {_ilike: $search}}}]}'
    );
    variables.search = `%${filter.search}%`;
  }

  const varDefs = [
    '$limit: Int!',
    '$offset: Int!',
    filter.type ? '$type: JobPostingType_enum!' : null,
    filter.region ? '$regions: [JobRegion_enum!]!' : null,
    filter.occupation ? '$occupation: JobOccupation_enum!' : null,
    filter.search ? '$search: String!' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const where = conditions.length ? `where: {_and: [${conditions.join(', ')}]},` : '';

  const query = /* GraphQL */ `
    query JobList(${varDefs}) {
      JobPosting(
        ${where}
        order_by: [{featured: desc}, {publishedAt: desc}]
        limit: $limit
        offset: $offset
      ) {
        ${LIST_FIELDS}
      }
      JobPosting_aggregate${conditions.length ? `(where: {_and: [${conditions.join(', ')}]})` : ''} {
        aggregate {
          count
        }
      }
    }
  `;

  const data = await fetchAnonymous<{
    JobPosting: JobListItem[];
    JobPosting_aggregate: { aggregate: { count: number } };
  }>(query, variables);

  return { jobs: data.JobPosting, totalCount: data.JobPosting_aggregate.aggregate.count };
}

export async function fetchJobDetail(id: number): Promise<JobDetail | null> {
  const query = /* GraphQL */ `
    query JobDetail($id: Int!) {
      JobPosting_by_pk(id: $id) {
        ${LIST_FIELDS}
        description
        shortDescription
        requirement
        salaryText
        startText
        durationText
        applicationDeadline
        workExperienceRequired
        hoursPerWeek
        language
        international
        internationalDescription
        customCompany
        pdfUrl
        JobPostingTags {
          name
        }
        Organization {
          id
          name
          logo
          description
          website
          city
        }
      }
    }
  `;
  const data = await fetchAnonymous<{ JobPosting_by_pk: JobDetail | null }>(query, { id });
  return data.JobPosting_by_pk;
}
