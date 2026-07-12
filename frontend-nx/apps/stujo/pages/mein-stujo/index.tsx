import { useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import Layout from '../../components/Layout';
import {
  ACTION_ROLE_CONTEXT,
  ARCHIVE_JOB_POSTING_ACTION,
  MY_JOB_ORGANIZATIONS,
  MY_JOB_POSTINGS,
  ORG_ADMIN_ROLE_CONTEXT,
  PUBLISH_JOB_POSTING_ACTION,
} from '../../lib/employer';
import { resolvePortal, PortalBranding } from '../../lib/portal';

type Props = { portal: PortalBranding };

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: 'Aktiv', className: 'stujo-chip stujo-chip--green' },
  EXPIRED: { label: 'Abgelaufen', className: 'stujo-chip stujo-chip--red' },
  DRAFT: { label: 'Entwurf', className: 'stujo-chip stujo-chip--grey' },
  PENDING_PAYMENT: { label: 'Zahlung offen', className: 'stujo-chip stujo-chip--yellow' },
  ARCHIVED: { label: 'Archiviert', className: 'stujo-chip stujo-chip--grey' },
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('de-DE') : '–';

/**
 * Employer dashboard ("Mein StuJo") — postings table, stats and the
 * publish/archive/re-post actions, per design/stujo-design.pen.
 */
const MeinStujo: FC<Props> = ({ portal }) => {
  const tType = useTranslations('jobType');
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [notice, setNotice] = useState<string | null>(null);

  const { data: orgData, loading: orgsLoading } = useQuery(MY_JOB_ORGANIZATIONS, {
    context: ORG_ADMIN_ROLE_CONTEXT,
    skip: sessionStatus !== 'authenticated',
  });
  const organization = orgData?.OrganizationAdmin?.[0]?.Organization ?? null;

  const { data, loading, refetch } = useQuery(MY_JOB_POSTINGS, {
    context: ORG_ADMIN_ROLE_CONTEXT,
    variables: { organizationId: organization?.id ?? 0 },
    skip: !organization,
  });

  const [publishPosting, { loading: publishing }] = useMutation(PUBLISH_JOB_POSTING_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });
  const [archivePosting] = useMutation(ARCHIVE_JOB_POSTING_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn('keycloak');
    }
  }, [sessionStatus]);

  // Payment return + re-post deep links (?payment=success / ?repost=id)
  useEffect(() => {
    if (router.query.payment === 'success') {
      setNotice('Zahlung erfolgreich – Dein Angebot ist veröffentlicht.');
    } else if (router.query.payment === 'cancelled') {
      setNotice('Zahlung abgebrochen – Dein Angebot ist weiterhin als Entwurf gespeichert.');
    }
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

  const handlePublish = async (jobPostingId: number) => {
    setNotice(null);
    const result = await publishPosting({ variables: { jobPostingId } });
    const payload = result.data?.publishJobPosting;
    if (payload?.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }
    if (payload?.success) {
      setNotice(
        payload.usedCredit
          ? 'Veröffentlicht – ein Gratis-Kontingent wurde eingelöst.'
          : 'Dein Angebot ist veröffentlicht.'
      );
      await refetch();
    } else {
      setNotice(`Veröffentlichen fehlgeschlagen: ${payload?.error ?? 'Unbekannter Fehler'}`);
    }
  };

  const handleArchive = async (jobPostingId: number) => {
    const result = await archivePosting({ variables: { jobPostingId } });
    if (result.data?.archiveJobPosting?.success) {
      await refetch();
    }
  };

  const stats = useMemo(() => {
    const postings = data?.JobPosting ?? [];
    const active = postings.filter((posting: any) => posting.status === 'PUBLISHED');
    const credits = (organization?.JobPostingCredits ?? []).reduce(
      (sum: number, credit: any) => sum + credit.remaining,
      0
    );
    return {
      active: active.length,
      views: active.reduce((sum: number, posting: any) => sum + (posting.views ?? 0), 0),
      credits,
    };
  }, [data, organization]);

  if (sessionStatus !== 'authenticated' || orgsLoading) {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">Anmeldung wird geprüft …</p>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout portal={portal}>
        <h1>Mein StuJo</h1>
        <p>
          Deinem Konto ist noch kein Unternehmen mit Stellen-Verwaltung zugeordnet. Bitte wende Dich
          an {portal.contactEmail || 'das StuJo-Team'}.
        </p>
      </Layout>
    );
  }

  return (
    <Layout portal={portal}>
      <div className="stujo-dash-head">
        <div>
          <h1 style={{ margin: 0 }}>Mein StuJo</h1>
          <p className="stujo-muted" style={{ margin: '0.25rem 0 0' }}>
            {organization.name}
          </p>
        </div>
        <Link href="/mein-stujo/neu" className="stujo-btn stujo-btn--primary">
          + Neues Angebot
        </Link>
      </div>

      {notice && <div className="stujo-notice">{notice}</div>}

      <div className="stujo-stats">
        {[
          ['Aktive Angebote', String(stats.active), false],
          ['Aufrufe gesamt', String(stats.views), false],
          ['Freie Kontingente', String(stats.credits), true],
        ].map(([label, value, accent]) => (
          <div key={label as string} className={`stujo-stat${accent ? ' stujo-stat--accent' : ''}`}>
            <div className="stujo-muted" style={{ fontSize: '0.8rem' }}>
              {label}
            </div>
            <div className="stujo-stat-value">{value}</div>
          </div>
        ))}
      </div>

      <table className="stujo-table">
        <thead>
          <tr>
            <th>Angebot</th>
            <th>Kategorie</th>
            <th>Status</th>
            <th>Aufrufe</th>
            <th>Läuft ab</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="stujo-muted">
                Lädt …
              </td>
            </tr>
          )}
          {data?.JobPosting?.map((posting: any) => {
            const status = STATUS_LABELS[posting.status] ?? STATUS_LABELS.DRAFT;
            return (
              <tr key={posting.id}>
                <td>
                  <Link href={`/mein-stujo/neu?id=${posting.id}`} style={{ fontWeight: 600 }}>
                    {posting.title}
                  </Link>
                </td>
                <td className="stujo-muted">{tType(posting.type)}</td>
                <td>
                  <span className={status.className}>{status.label}</span>
                </td>
                <td className="stujo-muted">{posting.views}</td>
                <td className="stujo-muted">{formatDate(posting.expiresAt)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Link
                    href={`/mein-stujo/neu?id=${posting.id}`}
                    className="stujo-button-pen"
                    title="Bearbeiten"
                    aria-label="Bearbeiten"
                  />
                  {(posting.status === 'DRAFT' || posting.status === 'PENDING_PAYMENT') && (
                    <button
                      className="stujo-btn stujo-btn--small"
                      disabled={publishing}
                      onClick={() => handlePublish(posting.id)}
                    >
                      Veröffentlichen
                    </button>
                  )}
                  {posting.status === 'EXPIRED' && (
                    <button
                      className="stujo-btn stujo-btn--small"
                      disabled={publishing}
                      onClick={() => handlePublish(posting.id)}
                    >
                      Erneut inserieren
                    </button>
                  )}
                  {posting.status === 'PUBLISHED' && (
                    <button
                      className="stujo-btn stujo-btn--small stujo-btn--ghost"
                      onClick={() => handleArchive(posting.id)}
                    >
                      Archivieren
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {!loading && data?.JobPosting?.length === 0 && (
            <tr>
              <td colSpan={6} className="stujo-muted">
                Noch keine Angebote – erstelle Dein erstes über „+ Neues Angebot“.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  return { props: { portal } };
};

export default MeinStujo;
