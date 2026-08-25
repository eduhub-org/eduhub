import { gql } from '@apollo/client';
import { FC, useState } from 'react';

import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
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
    JobPostingCredit(
      order_by: { id: desc }
      limit: 50
      where: { _or: [{ remaining: { _gt: 0 } }, { unlimited: { _eq: true } }] }
    ) {
      id
      remaining
      unlimited
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
    Organization(where: { name: { _ilike: $search } }, limit: 20) {
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
      unlimited
    }
  }
`;

const INSERT_CREDIT = gql`
  mutation AdminInsertCredit($organizationId: Int!, $remaining: Int!, $unlimited: Boolean!) {
    insert_JobPostingCredit_one(
      object: { organizationId: $organizationId, remaining: $remaining, unlimited: $unlimited }
    ) {
      id
    }
  }
`;

const INCREMENT_CREDIT = gql`
  mutation AdminIncrementCredit($id: Int!, $amount: Int!) {
    update_JobPostingCredit_by_pk(pk_columns: { id: $id }, _inc: { remaining: $amount }) {
      id
      remaining
    }
  }
`;

const SET_CREDIT = gql`
  mutation AdminSetCredit($id: Int!, $remaining: Int!, $unlimited: Boolean!) {
    update_JobPostingCredit_by_pk(
      pk_columns: { id: $id }
      _set: { remaining: $remaining, unlimited: $unlimited }
    ) {
      id
      remaining
      unlimited
    }
  }
`;

const DELETE_CREDIT = gql`
  mutation AdminDeleteCredit($id: Int!) {
    delete_JobPostingCredit_by_pk(id: $id) {
      id
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

/** "1 Gratis-Angebot" / "3 Gratis-Angebote" */
const formatGrantLabel = (amount: number) =>
  `+ ${amount} Gratis-Angebot${amount === 1 ? '' : 'e'}`;

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
  const [setCredit] = useAdminMutation(SET_CREDIT);
  const [deleteCredit] = useAdminMutation(DELETE_CREDIT);
  const [createStripePrices, { loading: bootstrapping }] = useAdminMutation(CREATE_STRIPE_PRICES);

  const [orgSearch, setOrgSearch] = useState('');
  const [grantAmount, setGrantAmount] = useState('1');
  const [grantingOrgId, setGrantingOrgId] = useState<number | null>(null);
  const [creditToDelete, setCreditToDelete] = useState<any | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<string | null>(null);
  const { data: orgData } = useAdminQuery(SEARCH_ORGANIZATIONS, {
    variables: { search: `%${orgSearch}%` },
    skip: orgSearch.trim().length < 2,
  });
  const { refetch: refetchCredit } = useAdminQuery(GET_CREDIT_FOR_ORG, { skip: true });

  const parsedAmount = Number(grantAmount.replace(',', '.'));
  const amount = Number.isInteger(parsedAmount) && parsedAmount > 0 ? parsedAmount : 1;

  /**
   * Grants free postings to an organization's untyped ("any paid type") credit
   * row: either `amount` more of them, or unlimited. The row is unique per
   * organization (partial index JobPostingCredit_organizationId_untyped_unique),
   * so a concurrent insert loses the race and is retried as an update.
   */
  const grantCredit = async (organizationId: number, unlimited: boolean) => {
    setGrantingOrgId(organizationId);
    try {
      const existing = await refetchCredit({ organizationId });
      const credit = existing.data?.JobPostingCredit?.[0];
      if (credit && unlimited) {
        await setCredit({ variables: { id: credit.id, remaining: credit.remaining, unlimited: true } });
      } else if (credit) {
        await incrementCredit({ variables: { id: credit.id, amount } });
      } else {
        try {
          await insertCredit({
            variables: { organizationId, remaining: unlimited ? 0 : amount, unlimited },
          });
        } catch {
          const raced = await refetchCredit({ organizationId });
          const other = raced.data?.JobPostingCredit?.[0];
          if (!other) throw new Error('Kontingent konnte nicht angelegt werden');
          if (unlimited) {
            await setCredit({
              variables: { id: other.id, remaining: other.remaining, unlimited: true },
            });
          } else {
            await incrementCredit({ variables: { id: other.id, amount } });
          }
        }
      }
      setOrgSearch('');
      await refetch();
    } finally {
      setGrantingOrgId(null);
    }
  };

  const updateCredit = async (credit: any, values: { remaining?: number; unlimited?: boolean }) => {
    await setCredit({
      variables: {
        id: credit.id,
        remaining: values.remaining ?? credit.remaining,
        unlimited: values.unlimited ?? credit.unlimited,
      },
    });
    await refetch();
  };

  const removeCredit = async (credit: any) => {
    await deleteCredit({ variables: { id: credit.id } });
    setCreditToDelete(null);
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

      <SectionTitle
        title="Kontingent vergeben"
        hint="Anzahl festlegen oder unbegrenzt kostenlos freischalten"
      />
      <div className="flex items-center gap-3">
        <input
          className="w-72 rounded bg-bg-card px-3 py-2 text-sm text-label-primary outline-none"
          placeholder="Organisation suchen …"
          value={orgSearch}
          onChange={(event) => setOrgSearch(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-label-secondary">
          Anzahl
          <input
            type="number"
            min={1}
            step={1}
            className="w-20 rounded bg-bg-card px-3 py-2 text-sm text-label-primary outline-none"
            value={grantAmount}
            onChange={(event) => setGrantAmount(event.target.value)}
          />
        </label>
      </div>
      {orgSearch.trim().length >= 2 && (
        <ul className="mt-2 w-[34rem] rounded bg-bg-card divide-y divide-white/10">
          {orgData?.Organization?.map((org: any) => (
            <li key={org.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-label-primary">{org.name}</span>
              <span className="flex items-center gap-4 whitespace-nowrap">
                <button
                  className="text-xs font-semibold text-brand hover:text-brand-light disabled:opacity-50"
                  disabled={grantingOrgId === org.id}
                  onClick={() => grantCredit(org.id, false)}
                >
                  {formatGrantLabel(amount)}
                </button>
                <button
                  className="text-xs font-semibold text-brand hover:text-brand-light disabled:opacity-50"
                  title="Diese Organisation darf dauerhaft kostenlos veröffentlichen"
                  disabled={grantingOrgId === org.id}
                  onClick={() => grantCredit(org.id, true)}
                >
                  Unbegrenzt
                </button>
              </span>
            </li>
          ))}
          {orgData?.Organization?.length === 0 && (
            <li className="px-3 py-2 text-sm text-label-secondary">Keine Treffer</li>
          )}
        </ul>
      )}
      {data?.JobPostingCredit?.length > 0 && (
        <>
          <SectionTitle title="Offene Kontingente" />
          <div className="rounded-lg bg-bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-label-secondary">
                  <th className="px-4 py-2">Organisation</th>
                  <th className="px-4 py-2">Typ</th>
                  <th className="px-4 py-2">Kontingent</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.JobPostingCredit.map((credit: any) => (
                  <tr key={credit.id} className="border-t border-white/10">
                    <td className="px-4 py-2 text-label-primary">{credit.Organization?.name}</td>
                    <td className="px-4 py-2 text-label-secondary">
                      {credit.jobPostingType ?? 'alle'}
                    </td>
                    <td className="px-4 py-2">
                      {credit.unlimited ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-300">
                          unbegrenzt
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="w-20 bg-transparent text-brand-light font-semibold outline-none border-b border-transparent focus:border-brand"
                          defaultValue={credit.remaining}
                          onBlur={async (event) => {
                            const next = Number(event.target.value);
                            if (Number.isInteger(next) && next >= 0 && next !== credit.remaining) {
                              await updateCredit(credit, { remaining: next });
                            }
                          }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {credit.unlimited && (
                        <button
                          className="mr-3 text-xs text-label-secondary hover:text-brand-light"
                          title="Auf ein zählbares Kontingent zurückstellen"
                          onClick={() => updateCredit(credit, { unlimited: false })}
                        >
                          Begrenzen
                        </button>
                      )}
                      <button
                        className="text-xs text-label-secondary hover:text-red-400"
                        onClick={() => setCreditToDelete(credit)}
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <QuestionConfirmationDialog
        open={creditToDelete !== null}
        title="Kontingent entfernen"
        question={`Kontingent von ${creditToDelete?.Organization?.name ?? ''} wirklich entfernen?`}
        confirmationText="Entfernen"
        onClose={() => setCreditToDelete(null)}
        onConfirm={() => removeCredit(creditToDelete)}
      />
    </div>
  );
};

export default ManageJobBoard;
