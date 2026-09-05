import { useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import DropDownSelector from '@eduhub/components/inputs/DropDownSelector';
import { useIsAdmin, useIsOrgAdmin } from '@eduhub/hooks/authentication';

import Layout from '../../components/Layout';
import StuJoLegacyIcon from '../../components/StuJoLegacyIcon';
import {
  ACTION_ROLE_CONTEXT,
  CLAIM_JOB_ORGANIZATION,
  REQUEST_JOB_ORGANIZATION_ACCESS,
  ORGANIZATION_OPTIONS,
  useEmployerRoleContext,
} from '../../lib/employer';
import { useEmployerOrganization } from '../../lib/useEmployerOrganization';
import { resolvePortal, PortalBranding } from '../../lib/portal';

type Props = { portal: PortalBranding };

/**
 * How many times to re-authenticate before giving up on picking the new role
 * up silently. The first attempt is an SSO round trip; the second forces a
 * fresh Keycloak authentication, which is what signing out and back in does.
 */
const MAX_ROLE_REFRESH_ATTEMPTS = 2;

/**
 * Keep `?next=` an in-app destination. It is echoed into a callbackUrl and into
 * router.replace, so an absolute or protocol-relative value would turn this
 * page — the one employers are sent to by link — into an open redirect.
 */
const safeNext = (value: unknown): string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/mein-stujo/neu';

/** Breathing room for the event trigger before a repeat attempt (ms). */
const ROLE_REFRESH_BACKOFF_MS = 1500;

type ClaimResult = {
  status?: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  existingAdminName?: string | null;
};

/**
 * Onboarding for an employer who cannot post yet: pick the organization whose
 * job offers you want to manage, or name one that is not on the board.
 *
 * This replaces the dead end the employer screens used to show ("no company is
 * assigned to your account, please write to us"). Nobody but a super-admin can
 * create an organization's first OrganizationAdmin row through Hasura, so the
 * claim runs through the claimJobOrganization action, which grants
 * canManageJobs when the organization has no job admin yet and mails the StuJo
 * contact address either way.
 *
 * The picker is the same component as the organization field in the EduHub
 * profile, sharing edu-hub's design tokens (AGENTS.md rule 10) rather than a
 * StuJo copy of it. It is used without mutations: creating the organization is
 * the action's job, so a failed claim leaves no orphan behind.
 */
const Unternehmen: FC<Props> = ({ portal }) => {
  const t = useTranslations('meinStujo');
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const employerRole = useEmployerRoleContext();
  const { organizations, loading: orgsLoading } = useEmployerOrganization();
  // Whether this session's token can actually reach the employer screens. The
  // grant lives in OrganizationAdmin, but Hasura only lets `org_admin` (or a
  // super-admin's `admin`) read and write job offers, and that role reaches the
  // token exclusively through Keycloak — so a committed claim is invisible until
  // the token carries it.
  const isOrgAdmin = useIsOrgAdmin();
  const isSuperAdmin = useIsAdmin();
  const canManageJobs = isOrgAdmin || isSuperAdmin;

  // What the picker currently holds, tracked as a tagged value rather than inferred from the
  // string: a company legitimately named "360" would otherwise be read back as organization id 360.
  const [selection, setSelection] = useState<
    { kind: 'none' } | { kind: 'existing'; id: string } | { kind: 'new'; name: string }
  >({ kind: 'none' });
  const [declared, setDeclared] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Where to go once the claim succeeds. `?next=` lets the employer screens
  // send someone here and get them back to what they were doing.
  const next = safeNext(router.query.next);

  // Set by the re-authentication round trip below so the page knows, on the way
  // back, that it must verify the role instead of offering the form again.
  const refreshing = router.query.refreshRole === '1';
  const attempt = Number.parseInt(String(router.query.attempt ?? ''), 10) || 0;

  const {
    data: optionsData,
    loading: optionsLoading,
    error: optionsError,
    refetch: refetchOptions,
  } = useQuery(ORGANIZATION_OPTIONS, {
    context: employerRole,
    skip: sessionStatus !== 'authenticated',
  });

  const options = useMemo(
    () =>
      (optionsData?.Organization ?? []).map(
        (organization: { id: number; name: string; aliases?: unknown }) => ({
          value: String(organization.id),
          label: organization.name,
          aliases: (organization.aliases as string[] | null) ?? null,
        })
      ),
    [optionsData]
  );

  const [claimOrganization, { loading: claiming }] = useMutation(CLAIM_JOB_ORGANIZATION, {
    context: ACTION_ROLE_CONTEXT,
  });
  const [requestAccess, { loading: requesting }] = useMutation(REQUEST_JOB_ORGANIZATION_ACCESS, {
    context: ACTION_ROLE_CONTEXT,
  });

  const login = useCallback(
    (register: boolean) =>
      signIn(
        'keycloak',
        { callbackUrl: router.asPath },
        { stujo_portal: portal.appName, ...(register ? { prompt: 'create' } : {}) }
      ),
    [portal.appName, router.asPath]
  );

  /**
   * Re-authenticate so the fresh token carries the org_admin role, and come back
   * *here* rather than straight to the posting form: only this page knows a
   * claim just happened, so only this page can tell "the refresh worked" from
   * "you have no company yet" — the message the employer used to be dropped
   * into, with no way out but signing out manually.
   *
   * Attempt 2 adds `prompt=login`, which makes Keycloak authenticate the user
   * again instead of answering from the existing SSO session.
   */
  const refreshRole = useCallback(
    (nextAttempt: number) =>
      signIn(
        'keycloak',
        {
          callbackUrl: `/mein-stujo/unternehmen?refreshRole=1&attempt=${nextAttempt}&next=${encodeURIComponent(
            next
          )}`,
        },
        {
          stujo_portal: portal.appName,
          ...(nextAttempt > 1 ? { prompt: 'login' } : {}),
        }
      ),
    [next, portal.appName]
  );

  // Back from a re-authentication: hand the employer on if the role arrived,
  // and otherwise try once more — the add_keycloak_org_admin_role event trigger
  // can still be catching up if the action's synchronous grant did not land.
  useEffect(() => {
    if (!refreshing || sessionStatus !== 'authenticated') return;
    if (canManageJobs) {
      router.replace(next);
      return;
    }
    if (attempt >= MAX_ROLE_REFRESH_ATTEMPTS) return;
    const timer = setTimeout(() => refreshRole(attempt + 1), ROLE_REFRESH_BACKOFF_MS);
    return () => clearTimeout(timer);
  }, [refreshing, sessionStatus, canManageJobs, attempt, next, refreshRole, router]);

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);
    setClaim(null);

    if (selection.kind === 'none' || (selection.kind === 'new' && selection.name.trim() === '')) {
      setError(t('claimPickOrganization'));
      return;
    }
    if (!declared) {
      setError(t('claimDeclarationRequired'));
      return;
    }

    try {
      const result = await claimOrganization({
        variables: {
          // Exactly one of the two: an id when a suggestion was picked, the raw
          // text when the employer named a company that is not on the board.
          organizationId: selection.kind === 'existing' ? Number(selection.id) : null,
          newOrganizationName: selection.kind === 'new' ? selection.name.trim() : null,
          portalAppName: portal.appName,
          declareAuthorization: true,
        },
      });
      const payload = result.data?.claimJobOrganization;

      if (!payload?.success) {
        setError(t('claimFailed', { error: payload?.error ?? t('unknownError') }));
        return;
      }

      if (payload.status === 'ALREADY_CLAIMED') {
        setClaim(payload);
        return;
      }

      // The grant is in the database, but this session's token predates it and
      // still lacks the org_admin role, so every posting query and write would be
      // rejected. Re-authenticating is a silent redirect through the existing
      // Keycloak session and comes back with the role.
      setRedirecting(true);
      await refreshRole(1);
    } catch (caught: any) {
      console.error('claimJobOrganization failed', caught);
      setError(t('claimNetworkError'));
    }
  };

  const handleRequestAccess = async () => {
    if (!claim?.organizationId) return;
    setError(null);
    try {
      const result = await requestAccess({
        variables: { organizationId: claim.organizationId, portalAppName: portal.appName },
      });
      const payload = result.data?.requestJobOrganizationAccess;
      if (payload?.success) {
        setNotice(t('accessRequestSent'));
        setClaim(null);
      } else if (payload?.messageKey === 'REQUEST_ALREADY_SENT') {
        setNotice(t('accessRequestAlreadySent'));
      } else {
        setError(t('accessRequestFailed', { error: payload?.error ?? t('unknownError') }));
      }
    } catch (caught) {
      console.error('requestJobOrganizationAccess failed', caught);
      setError(t('claimNetworkError'));
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">{t('checkingLogin')}</p>
      </Layout>
    );
  }

  // Deliberately not the automatic redirect the other employer screens use: an
  // employer arriving here has usually never had an account, and the Keycloak
  // page explains that StuJo runs on their opencampus account. Showing why they
  // are being asked to sign in first makes that far less surprising.
  if (sessionStatus !== 'authenticated') {
    return (
      <Layout portal={portal}>
        <h1>{t('claimTitle')}</h1>
        <p style={{ maxWidth: '40em' }}>{t('claimSignedOutIntro')}</p>
        <p className="stujo-form-actions">
          <button type="button" className="stujo-btn stujo-btn--primary" onClick={() => login(true)}>
            <StuJoLegacyIcon name="plus" className="stujo-header-action-icon" />
            {t('claimRegister')}
          </button>
          <button type="button" className="stujo-btn stujo-btn--ghost" onClick={() => login(false)}>
            {t('claimLogin')}
          </button>
        </p>
      </Layout>
    );
  }

  if (redirecting || (refreshing && !canManageJobs && attempt < MAX_ROLE_REFRESH_ATTEMPTS)) {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">{t('claimSettingUpAccess')}</p>
      </Layout>
    );
  }

  // Every silent attempt is spent and the token still has no org_admin role.
  // The access itself is granted — say so, and say what does fix it — rather
  // than showing the picker again, which would only re-claim what they hold.
  if (refreshing && !canManageJobs) {
    return (
      <Layout portal={portal}>
        <h1>{t('claimTitle')}</h1>
        <div className="stujo-notice stujo-notice--error">{t('claimRoleRefreshFailed')}</div>
        <p className="stujo-form-actions">
          <button
            type="button"
            className="stujo-btn stujo-btn--primary"
            onClick={() => refreshRole(MAX_ROLE_REFRESH_ATTEMPTS)}
          >
            {t('claimRoleRefreshRetry')}
          </button>
        </p>
        <p className="stujo-muted">
          {t('claimContactFallback', { contact: portal.contactEmail || t('defaultContact') })}
        </p>
      </Layout>
    );
  }

  return (
    <Layout portal={portal}>
      <h1>{t('claimTitle')}</h1>

      {orgsLoading ? null : organizations.length > 0 ? (
        <p style={{ maxWidth: '40em' }}>
          {t('claimExistingIntro', {
            organizations: organizations.map((organization) => organization.name).join(', '),
          })}
        </p>
      ) : (
        <p style={{ maxWidth: '40em' }}>{t('claimIntro')}</p>
      )}

      {notice && <div className="stujo-notice">{notice}</div>}
      {error && <div className="stujo-notice stujo-notice--error">{error}</div>}

      {claim?.status === 'ALREADY_CLAIMED' ? (
        <div className="stujo-order-box" style={{ marginTop: '1rem' }}>
          <p style={{ marginTop: 0 }}>
            {claim.existingAdminName
              ? t('claimAlreadyClaimedByName', {
                  organization: claim.organizationName ?? '',
                  name: claim.existingAdminName,
                })
              : t('claimAlreadyClaimed', { organization: claim.organizationName ?? '' })}
          </p>
          <button
            type="button"
            className="stujo-btn stujo-btn--primary"
            disabled={requesting}
            onClick={handleRequestAccess}
          >
            {t('claimRequestAccess')}
          </button>
          <p className="stujo-muted" style={{ marginBottom: 0 }}>
            {t('claimContactFallback', { contact: portal.contactEmail || t('defaultContact') })}
          </p>
        </div>
      ) : (
        <div className="stujo-form" style={{ maxWidth: '32rem' }}>
          {/* The picker filters its options client-side, so until they arrive it would offer
              nothing but "create" — and an employer whose company IS on the board would create a
              duplicate of it. Say what is happening instead, and keep submit closed. */}
          {optionsError ? (
            <div className="stujo-notice stujo-notice--error">
              {t('claimOptionsError')}{' '}
              <button
                type="button"
                className="stujo-btn stujo-btn--small stujo-btn--ghost"
                onClick={() => refetchOptions()}
              >
                {t('claimOptionsRetry')}
              </button>
            </div>
          ) : optionsLoading ? (
            <p className="stujo-muted">{t('claimOptionsLoading')}</p>
          ) : (
            <DropDownSelector
              variant="eduhub"
              label={t('claimOrganizationLabel')}
              placeholder={t('claimOrganizationPlaceholder')}
              value={selection.kind === 'existing' ? selection.id : ''}
              options={options}
              creatable
              className="stujo-field"
              // Without an updateValueMutation the component reports through onValueUpdated for
              // BOTH cases: an option's id when a suggestion is picked, and the raw text when
              // "create" is chosen (it fires right after onOptionCreated). onOptionCreated is what
              // distinguishes them, so it tags the selection and onValueUpdated only overrides that
              // tag when the value is a known option's id.
              onValueUpdated={(value: string) => {
                const picked = options.find((option: { value: string }) => option.value === value);
                setSelection(picked ? { kind: 'existing', id: value } : { kind: 'new', name: value });
              }}
              onOptionCreated={(value: string) => setSelection({ kind: 'new', name: value })}
            />
          )}

          {selection.kind === 'new' && selection.name.trim() !== '' && (
            <p className="stujo-muted">{t('claimWillCreate', { name: selection.name })}</p>
          )}

          <label className="stujo-consent">
            <input
              type="checkbox"
              checked={declared}
              onChange={(event) => setDeclared(event.target.checked)}
            />
            <span>{t('claimDeclaration')}</span>
          </label>

          <div className="stujo-form-actions">
            <button
              type="button"
              className="stujo-btn stujo-btn--primary"
              disabled={claiming || optionsLoading || Boolean(optionsError)}
              onClick={handleSubmit}
            >
              {t('claimSubmit')}
            </button>
            <Link href="/mein-stujo" className="stujo-btn stujo-btn--ghost">
              {t('claimCancel')}
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  return { props: { portal } };
};

export default Unternehmen;
