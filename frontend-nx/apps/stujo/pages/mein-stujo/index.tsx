import { useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import OrganizationSwitcher from '../../components/OrganizationSwitcher';
import {
  ACTION_ROLE_CONTEXT,
  ARCHIVE_JOB_POSTING_ACTION,
  MY_JOB_POSTINGS,
  PUBLISH_JOB_POSTING_ACTION,
  useEmployerRoleContext,
} from '../../lib/employer';
import { useEmployerOrganization } from '../../lib/useEmployerOrganization';
import { summarizeCredits } from '../../lib/credits';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { portalHost } from '../../lib/requestHost';

type Props = { portal: PortalBranding };

type JobPosting = {
  id: number;
  title: string;
  type: string;
  status: string;
  views: number | null;
  expiresAt: string | null;
};

type PostingActionsProps = {
  posting: JobPosting;
  publishing: boolean;
  onPublish: (jobPostingId: number) => void;
  onArchive: (jobPostingId: number) => void;
};

// Status label text lives in the `meinStujo.status` translation namespace;
// only the chip styling is kept here (keyed by the same status value).
const STATUS_CLASSNAMES: Record<string, string> = {
  PUBLISHED: 'stujo-chip stujo-chip--green',
  EXPIRED: 'stujo-chip stujo-chip--red',
  DRAFT: 'stujo-chip stujo-chip--grey',
  PENDING_PAYMENT: 'stujo-chip stujo-chip--yellow',
  ARCHIVED: 'stujo-chip stujo-chip--grey',
};

// Pin the timezone so server (UTC) and client (local) render the same
// calendar day; otherwise timestamps near midnight UTC hydrate as off-by-one
// dates (React hydration mismatch).
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })
    : '–';

const PostingActions: FC<PostingActionsProps> = ({
  posting,
  publishing,
  onPublish,
  onArchive,
}) => {
  const t = useTranslations('meinStujo');

  return (
    <div className="stujo-posting-actions">
      <Link
        href={`/mein-stujo/neu?id=${posting.id}`}
        className="stujo-button-pen"
        title={t('edit')}
        aria-label={t('edit')}
      />
      {(posting.status === 'DRAFT' || posting.status === 'PENDING_PAYMENT') && (
        <button
          className="stujo-btn stujo-btn--small"
          disabled={publishing}
          onClick={() => onPublish(posting.id)}
        >
          {t('publish')}
        </button>
      )}
      {posting.status === 'EXPIRED' && (
        <button
          className="stujo-btn stujo-btn--small"
          disabled={publishing}
          onClick={() => onPublish(posting.id)}
        >
          {t('repost')}
        </button>
      )}
      {posting.status === 'PUBLISHED' && (
        <button
          className="stujo-btn stujo-btn--small stujo-btn--ghost"
          onClick={() => onArchive(posting.id)}
        >
          {t('archive')}
        </button>
      )}
    </div>
  );
};

/**
 * Employer dashboard ("Mein StuJo") — postings table, stats and the
 * publish/archive/re-post actions, per design/stujo-design.pen.
 */
const MeinStujo: FC<Props> = ({ portal }) => {
  const t = useTranslations('meinStujo');
  const tType = useTranslations('jobType');
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [notice, setNotice] = useState<string | null>(null);
  const [consentNeededFor, setConsentNeededFor] = useState<number | null>(null);

  const employerRole = useEmployerRoleContext();
  const {
    organizations,
    organization,
    loading: orgsLoading,
    selectOrganization,
  } = useEmployerOrganization();

  // cache-and-network: the Apollo client is a module singleton that outlives
  // client-side navigation, so a cache-first read served the list from before
  // /mein-stujo/neu created the posting -- a freshly published offer only
  // appeared after a hard reload. Cached rows still render instantly; the
  // network result (new posting, updated status/views) replaces them.
  const { data, loading, refetch } = useQuery(MY_JOB_POSTINGS, {
    context: employerRole,
    variables: { organizationId: organization?.id ?? 0 },
    skip: !organization,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const [publishPosting, { loading: publishing }] = useMutation(PUBLISH_JOB_POSTING_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });
  const [archivePosting] = useMutation(ARCHIVE_JOB_POSTING_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn('keycloak', undefined, { stujo_portal: portal.appName });
    }
  }, [portal.appName, sessionStatus]);

  // Payment return + re-post deep links (?payment=success / ?repost=id)
  useEffect(() => {
    if (router.query.payment === 'success') {
      setNotice(t('noticePaymentSuccess'));
    } else if (router.query.payment === 'cancelled') {
      setNotice(t('noticePaymentCancelled'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.payment]);

  // "Jetzt erneut inserieren" mail CTA: trigger the re-publish once the
  // postings are loaded, then drop the parameter so it fires only once.
  useEffect(() => {
    const repostId = Number(router.query.repost);
    if (!repostId || !data?.JobPosting) return;
    const posting = data.JobPosting.find((p: any) => p.id === repostId);
    router.replace('/mein-stujo', undefined, { shallow: true });
    if (posting && ['EXPIRED', 'DRAFT', 'PENDING_PAYMENT'].includes(posting.status)) {
      handlePublish(repostId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.repost, data]);

  const handlePublish = async (jobPostingId: number, acceptTerms = false) => {
    setNotice(null);
    try {
      const result = await publishPosting({ variables: { jobPostingId, acceptTerms } });
      const payload = result.data?.publishJobPosting;
      if (payload?.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      if (payload?.success) {
        setConsentNeededFor(null);
        setNotice(payload.usedCredit ? t('noticePublishedCredit') : t('noticePublished'));
        await refetch();
      } else if (payload?.messageKey === 'TERMS_NOT_ACCEPTED') {
        // A posting published before consent was recorded, or reposted from an
        // expiry mail. Ask here rather than failing the action.
        setConsentNeededFor(jobPostingId);
      } else {
        setNotice(t('publishFailed', { error: payload?.error ?? t('unknownError') }));
      }
    } catch (error) {
      console.error('publishJobPosting failed', error);
      setNotice(t('publishNetworkError'));
    }
  };

  const handleArchive = async (jobPostingId: number) => {
    setNotice(null);
    try {
      const result = await archivePosting({ variables: { jobPostingId } });
      if (result.data?.archiveJobPosting?.success) {
        await refetch();
      } else {
        setNotice(
          t('archiveFailed', {
            error: result.data?.archiveJobPosting?.error ?? t('unknownError'),
          })
        );
      }
    } catch (error) {
      console.error('archiveJobPosting failed', error);
      setNotice(t('archiveNetworkError'));
    }
  };

  const stats = useMemo(() => {
    const postings = data?.JobPosting ?? [];
    const active = postings.filter((posting: any) => posting.status === 'PUBLISHED');
    const credits = summarizeCredits(organization?.JobPostingCredits);
    return {
      active: active.length,
      views: active.reduce((sum: number, posting: any) => sum + (posting.views ?? 0), 0),
      credits,
    };
  }, [data, organization]);

  const postings: JobPosting[] = data?.JobPosting ?? [];

  if (sessionStatus !== 'authenticated' || orgsLoading) {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">{t('checkingLogin')}</p>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout portal={portal}>
        <h1>{t('title')}</h1>
        <p style={{ maxWidth: '40em' }}>{t('noOrganization')}</p>
        <p>
          <Link href="/mein-stujo/unternehmen" className="stujo-btn stujo-btn--primary">
            {t('claimCta')}
          </Link>
        </p>
        <p className="stujo-muted">
          {t('claimContactFallback', { contact: portal.contactEmail || t('defaultContact') })}
        </p>
      </Layout>
    );
  }

  return (
    <Layout portal={portal}>
      <div className="stujo-dash-head">
        <div>
          <h1 style={{ margin: 0 }}>{t('title')}</h1>
          {organizations.length > 1 ? (
            <OrganizationSwitcher
              organizations={organizations}
              selectedId={organization.id}
              label={t('organizationLabel')}
              onSelect={selectOrganization}
            />
          ) : (
            <p className="stujo-muted" style={{ margin: '0.25rem 0 0' }}>
              {organization.name}
            </p>
          )}
          <p className="stujo-muted" style={{ margin: '0.25rem 0 0' }}>
            <Link href="/mein-stujo/unternehmen">{t('claimAddAnother')}</Link>
          </p>
        </div>
        <Link href="/mein-stujo/neu" className="stujo-btn stujo-btn--primary">
          {t('newOffer')}
        </Link>
      </div>

      {notice && <div className="stujo-notice">{notice}</div>}

      {consentNeededFor !== null && (
        <div className="stujo-notice">
          <label className="stujo-consent">
            <span>
              {t('consentPromptPrefix')}{' '}
              <Link href="/agb" target="_blank" rel="noreferrer">
                {t('acceptTermsLink')}
              </Link>
              {t('consentPromptSuffix')}
            </span>
          </label>
          <button
            className="stujo-btn stujo-btn--accent"
            onClick={() => handlePublish(consentNeededFor, true)}
          >
            {t('consentAcceptAndPublish')}
          </button>
        </div>
      )}

      <div className="stujo-stats">
        {[
          [t('statActiveOffers'), String(stats.active), false],
          [t('statTotalViews'), String(stats.views), false],
          [
            t('statFreeCredits'),
            stats.credits.unlimited ? t('statFreeCreditsUnlimited') : String(stats.credits.total),
            true,
          ],
        ].map(([label, value, accent]) => (
          <div key={label as string} className={`stujo-stat${accent ? ' stujo-stat--accent' : ''}`}>
            <div className="stujo-muted" style={{ fontSize: '0.8rem' }}>
              {label}
            </div>
            <div className="stujo-stat-value">{value}</div>
          </div>
        ))}
      </div>

      {loading && !data ? (
        <p className="stujo-muted">{t('loading')}</p>
      ) : postings.length === 0 ? (
        <p className="stujo-muted">{t('noOffers')}</p>
      ) : (
        <>
          <ul className="stujo-posting-list" aria-label={t('title')}>
            {postings.map((posting) => {
              const statusClassName =
                STATUS_CLASSNAMES[posting.status] ?? STATUS_CLASSNAMES.DRAFT;

              return (
                <li key={posting.id} className="stujo-posting-card">
                  <div className="stujo-posting-card-head">
                    <h2 className="stujo-posting-card-title">
                      <Link href={`/mein-stujo/neu?id=${posting.id}`}>{posting.title}</Link>
                    </h2>
                    <span className={statusClassName}>{t(`status.${posting.status}`)}</span>
                  </div>
                  <dl className="stujo-posting-details">
                    <div>
                      <dt>{t('colCategory')}</dt>
                      <dd>{tType(posting.type)}</dd>
                    </div>
                    <div>
                      <dt>{t('colViews')}</dt>
                      <dd>{posting.views}</dd>
                    </div>
                    <div>
                      <dt>{t('colExpires')}</dt>
                      <dd>{formatDate(posting.expiresAt)}</dd>
                    </div>
                  </dl>
                  <PostingActions
                    posting={posting}
                    publishing={publishing}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                  />
                </li>
              );
            })}
          </ul>

          <table className="stujo-table stujo-postings-table">
            <thead>
              <tr>
                <th>{t('colOffer')}</th>
                <th>{t('colCategory')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colViews')}</th>
                <th>{t('colExpires')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {postings.map((posting) => {
                const statusClassName =
                  STATUS_CLASSNAMES[posting.status] ?? STATUS_CLASSNAMES.DRAFT;
                return (
                  <tr key={posting.id}>
                    <td>
                      <Link href={`/mein-stujo/neu?id=${posting.id}`} style={{ fontWeight: 600 }}>
                        {posting.title}
                      </Link>
                    </td>
                    <td className="stujo-muted">{tType(posting.type)}</td>
                    <td>
                      <span className={statusClassName}>{t(`status.${posting.status}`)}</span>
                    </td>
                    <td className="stujo-muted">{posting.views}</td>
                    <td className="stujo-muted">{formatDate(posting.expiresAt)}</td>
                    <td>
                      <PostingActions
                        posting={posting}
                        publishing={publishing}
                        onPublish={handlePublish}
                        onArchive={handleArchive}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(portalHost(req));
  return { props: { portal } };
};

export default MeinStujo;
