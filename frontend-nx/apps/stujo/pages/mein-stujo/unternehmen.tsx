import { useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import DropDownSelector from '@eduhub/components/inputs/DropDownSelector';

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
  const next = typeof router.query.next === 'string' ? router.query.next : '/mein-stujo/neu';

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
      // still lacks the org_admin role, so every posting write would be
      // rejected. Re-authenticating is a silent redirect through the existing
      // Keycloak session and comes back with the role.
      setRedirecting(true);
      await signIn('keycloak', { callbackUrl: next }, { stujo_portal: portal.appName });
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

  if (redirecting) {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">{t('claimSettingUpAccess')}</p>
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
