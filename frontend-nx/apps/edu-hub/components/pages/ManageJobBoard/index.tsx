import { gql } from '@apollo/client';
import { FC, useState } from 'react';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';

/**
 * Admin view for the StuJo job board (settings section "jobboerse").
 * Post-hoc moderation of published postings, portal overview, prices and
 * credit grants — the admin counterpart of design/stujo-design.pen.
 */

const JOB_BOARD_ADMIN_QUERY = gql`
  query JobBoardAdmin {
    JobPosting(order_by: { publishedAt: desc_nulls_last }, limit: 25) {
      id
      title
      type
      status
      featured
      publishedAt
      expiresAt
      views
      Organization {
        id
        name
      }
      Invoices {
        grossTotal
        currency
        status
      }
    }
    JobPortal(order_by: { id: asc }) {
      id
      slug
      title
      contactEmail
      defaultRegion
      Organization {
        name
      }
      AppSetting {
        domain
        primaryColor
        secondaryColor
      }
    }
    JobPostingPrice(order_by: { price: asc }) {
      id
      jobPostingType
      price
      currency
      vatRate
      durationDays
      stripePriceId
    }
    JobPostingCredit(order_by: { id: desc }, limit: 10, where: { remaining: { _gt: 0 } }) {
      id
      remaining
      jobPostingType
      Organization {
        id
        name
      }
    }
  }
`;

const UPDATE_POSTING_STATUS = gql`
  mutation AdminUpdateJobPostingStatus($id: Int!, $status: JobPostingStatus_enum!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

const UPDATE_POSTING_FEATURED = gql`
  mutation AdminUpdateJobPostingFeatured($id: Int!, $featured: Boolean!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { featured: $featured }) {
      id
      featured
    }
  }
`;

const UPDATE_PRICE = gql`
  mutation AdminUpdateJobPostingPrice($id: Int!, $price: Int!) {
    update_JobPostingPrice_by_pk(pk_columns: { id: $id }, _set: { price: $price }) {
      id
      price
    }
  }
`;

const SEARCH_ORGANIZATIONS = gql`
  query AdminSearchOrganizations($search: String!) {
    Organization(where: { name: { _ilike: $search }, type: { _eq: CORPORATION } }, limit: 5) {
      id
      name
    }
  }
`;

const GET_CREDIT_FOR_ORG = gql`
  query AdminGetCreditForOrg($organizationId: Int!) {
    JobPostingCredit(
      where: { organizationId: { _eq: $organizationId }, jobPostingType: { _is_null: true } }
      limit: 1
    ) {
      id
      remaining
    }
  }
`;

const INSERT_CREDIT = gql`
  mutation AdminInsertCredit($organizationId: Int!) {
    insert_JobPostingCredit_one(object: { organizationId: $organizationId, remaining: 1 }) {
      id
    }
  }
`;

const INCREMENT_CREDIT = gql`
  mutation AdminIncrementCredit($id: Int!) {
    update_JobPostingCredit_by_pk(pk_columns: { id: $id }, _inc: { remaining: 1 }) {
      id
      remaining
    }
  }
`;

const CREATE_STRIPE_PRICES = gql`
  mutation AdminCreateStripeJobPostingPrices {
    createStripeJobPostingPrices {
      success
      taxRateId
      error
    }
  }
`;

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-green-900/40 text-green-300',
  EXPIRED: 'bg-red-900/40 text-red-300',
  ARCHIVED: 'bg-gray-700 text-gray-300',
  DRAFT: 'bg-gray-700 text-gray-300',
  PENDING_PAYMENT: 'bg-yellow-900/40 text-yellow-300',
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('de-DE') : '–';

const formatPrice = (cents: number) =>
  cents === 0 ? 'kostenlos' : `${(cents / 100).toFixed(2).replace('.', ',')} €`;

const SectionTitle: FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="flex items-baseline justify-between mt-8 mb-3">
    <h2 className="text-lg font-semibold text-label-primary">{title}</h2>
    {hint && <span className="text-sm text-label-secondary">{hint}</span>}
  </div>
);

const ManageJobBoard: FC = () => {
  const { data, loading, error, refetch } = useAdminQuery(JOB_BOARD_ADMIN_QUERY);
  const [updateStatus] = useAdminMutation(UPDATE_POSTING_STATUS);
  const [updateFeatured] = useAdminMutation(UPDATE_POSTING_FEATURED);
  const [updatePrice] = useAdminMutation(UPDATE_PRICE);
  const [insertCredit] = useAdminMutation(INSERT_CREDIT);
  const [incrementCredit] = useAdminMutation(INCREMENT_CREDIT);
  const [createStripePrices, { loading: bootstrapping }] = useAdminMutation(CREATE_STRIPE_PRICES);

  const [orgSearch, setOrgSearch] = useState('');
  const [bootstrapResult, setBootstrapResult] = useState<string | null>(null);
  const { data: orgData } = useAdminQuery(SEARCH_ORGANIZATIONS, {
    variables: { search: `%${orgSearch}%` },
    skip: orgSearch.trim().length < 2,
  });
  const { refetch: refetchCredit } = useAdminQuery(GET_CREDIT_FOR_ORG, { skip: true });

  const grantCredit = async (organizationId: number) => {
    const existing = await refetchCredit({ organizationId });
    const credit = existing.data?.JobPostingCredit?.[0];
    if (credit) {
      await incrementCredit({ variables: { id: credit.id } });
    } else {
      await insertCredit({ variables: { organizationId } });
    }
    setOrgSearch('');
    await refetch();
  };

  const runBootstrap = async () => {
    const result = await createStripePrices();
    const payload = result.data?.createStripeJobPostingPrices;
    setBootstrapResult(
      payload?.success
        ? `OK — STRIPE_TAX_RATE_ID=${payload.taxRateId}`
        : `Fehler: ${payload?.error ?? 'unbekannt'}`
    );
    await refetch();
  };

  if (loading) return <div className="p-6 text-label-secondary">Lädt …</div>;
  if (error) return <div className="p-6 text-red-400">Fehler: {error.message}</div>;

  return (
    <div className="max-w-5xl">
      <SectionTitle
        title="Neue Veröffentlichungen"
        hint="Angebote werden sofort veröffentlicht – hier nachträglich prüfen"
      />
      <div className="rounded-lg bg-bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-label-secondary">
              <th className="px-4 py-2">Angebot</th>
              <th className="px-4 py-2">Arbeitgeber</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Bezahlt</th>
              <th className="px-4 py-2">Veröffentlicht</th>
              <th className="px-4 py-2">Aufrufe</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.JobPosting?.map((posting: any) => (
              <tr key={posting.id} className="border-t border-white/10">
                <td className="px-4 py-2 font-medium text-brand-light">{posting.title}</td>
                <td className="px-4 py-2 text-label-secondary">{posting.Organization?.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[posting.status] ?? ''}`}
                  >
                    {posting.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-label-secondary">
                  {posting.Invoices?.length
                    ? `${formatPrice(posting.Invoices[0].grossTotal)} (${posting.Invoices[0].status})`
                    : '–'}
                </td>
                <td className="px-4 py-2 text-label-secondary">{formatDate(posting.publishedAt)}</td>
                <td className="px-4 py-2 text-label-secondary">{posting.views}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <button
                    className={`mr-3 text-xs ${posting.featured ? 'text-brand' : 'text-label-secondary'} hover:text-brand-light`}
                    title="Hervorheben"
                    onClick={async () => {
                      await updateFeatured({
                        variables: { id: posting.id, featured: !posting.featured },
                      });
                      await refetch();
                    }}
                  >
                    ★
                  </button>
                  {posting.status === 'PUBLISHED' && (
                    <button
                      className="text-xs text-label-secondary hover:text-red-400"
                      onClick={async () => {
                        await updateStatus({ variables: { id: posting.id, status: 'ARCHIVED' } });
                        await refetch();
                      }}
                    >
                      Archivieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle title="Portale (AppSettings)" />
      <div className="rounded-lg bg-bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-label-secondary">
              <th className="px-4 py-2">Portal</th>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">Hochschule</th>
              <th className="px-4 py-2">Region-Filter</th>
              <th className="px-4 py-2">Branding</th>
            </tr>
          </thead>
          <tbody>
            {data?.JobPortal?.map((portal: any) => (
              <tr key={portal.id} className="border-t border-white/10">
                <td className="px-4 py-2 font-medium text-label-primary">{portal.slug}</td>
                <td className="px-4 py-2 text-label-secondary">{portal.AppSetting?.domain ?? '–'}</td>
                <td className="px-4 py-2 text-label-secondary">{portal.Organization?.name ?? '–'}</td>
                <td className="px-4 py-2 text-label-secondary">{portal.defaultRegion ?? '–'}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex gap-1">
                    {[portal.AppSetting?.primaryColor, portal.AppSetting?.secondaryColor]
                      .filter(Boolean)
                      .map((color: string) => (
                        <span
                          key={color}
                          className="inline-block h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle title="Preise & Kontingente" hint="Netto zzgl. 19 % MwSt., 56 Tage sichtbar" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {data?.JobPostingPrice?.map((price: any) => (
          <div key={price.id} className="rounded-lg bg-bg-card p-3">
            <div className="text-xs text-label-secondary">{price.jobPostingType}</div>
            <input
              className="mt-1 w-full bg-transparent text-brand-light font-semibold outline-none border-b border-transparent focus:border-brand"
              defaultValue={(price.price / 100).toFixed(2)}
              onBlur={async (event) => {
                const cents = Math.round(Number(event.target.value.replace(',', '.')) * 100);
                if (Number.isInteger(cents) && cents >= 0 && cents !== price.price) {
                  await updatePrice({ variables: { id: price.id, price: cents } });
                  await refetch();
                }
              }}
            />
            <div className="text-[11px] text-label-secondary mt-1">
              {price.stripePriceId ? 'Stripe ✓' : 'Stripe fehlt'}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-bg-primary disabled:opacity-50"
          disabled={bootstrapping}
          onClick={runBootstrap}
        >
          Stripe-Preise erzeugen
        </button>
        {bootstrapResult && <span className="text-xs text-label-secondary">{bootstrapResult}</span>}
      </div>

      <SectionTitle title="Kontingent vergeben" />
      <div className="flex items-center gap-3">
        <input
          className="w-72 rounded bg-bg-card px-3 py-2 text-sm text-label-primary outline-none"
          placeholder="Organisation suchen …"
          value={orgSearch}
          onChange={(event) => setOrgSearch(event.target.value)}
        />
      </div>
      {orgSearch.trim().length >= 2 && (
        <ul className="mt-2 w-72 rounded bg-bg-card divide-y divide-white/10">
          {orgData?.Organization?.map((org: any) => (
            <li key={org.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-label-primary">{org.name}</span>
              <button
                className="text-xs font-semibold text-brand hover:text-brand-light"
                onClick={() => grantCredit(org.id)}
              >
                + 1 Gratis-Angebot
              </button>
            </li>
          ))}
          {orgData?.Organization?.length === 0 && (
            <li className="px-3 py-2 text-sm text-label-secondary">Keine Treffer</li>
          )}
        </ul>
      )}
      {data?.JobPostingCredit?.length > 0 && (
        <div className="mt-3 text-sm text-label-secondary">
          Offene Kontingente:{' '}
          {data.JobPostingCredit.map((credit: any) => (
            <span key={credit.id} className="mr-3">
              {credit.Organization?.name}: {credit.remaining}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageJobBoard;
