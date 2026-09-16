import { useMutation } from '@apollo/client';
import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ACTION_ROLE_CONTEXT, UPDATE_ORGANIZATION_WEBSITE_ACTION } from '../lib/employer';
import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organization: EmployerOrganization;
  onWebsiteUpdated: () => void;
}

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  UNAUTHORIZED: 'organizationWebsite.permissionDenied',
  INVALID_INPUT: 'organizationWebsite.invalidUrl',
};

// A prefix check alone would accept "https://" (no host); parse it for real.
const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
};

/**
 * Inline editor for the currently selected organization's public website
 * link, placed next to OrganizationLogoEditor in the dashboard header.
 *
 * Authorization is enforced server-side by the updateOrganizationWebsite
 * action, not here -- same rule as the logo (see
 * authorizeOrganizationAdminFieldChange): a settings admin may always change
 * it, and a job-offer-only admin (the capability every StuJo dashboard
 * organization implies) may too as long as the organization has no settings
 * admin of its own. The field is always shown and editable regardless of
 * which capability the caller holds -- the UI has no way to know in advance
 * whether a settings admin exists; a caller who no longer qualifies simply
 * sees the action's error message on save.
 */
const OrganizationWebsiteEditor: FC<Props> = ({ organization, onWebsiteUpdated }) => {
  const t = useTranslations('meinStujo');
  const [value, setValue] = useState(organization.website ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [updateWebsite, { loading }] = useMutation(UPDATE_ORGANIZATION_WEBSITE_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });

  const trimmed = value.trim();
  const isValid = trimmed === '' || isAbsoluteHttpUrl(trimmed);
  const isUnchanged = trimmed === (organization.website ?? '');

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    setError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      const result = await updateWebsite({
        variables: { organizationId: organization.id, website: trimmed || null },
      });
      const payload = result.data?.updateOrganizationWebsite;
      if (payload?.success) {
        setSaved(true);
        onWebsiteUpdated();
      } else {
        setError(t(ERROR_MESSAGE_KEYS[payload?.messageKey ?? ''] ?? 'organizationWebsite.saveError'));
      }
    } catch (updateError) {
      console.error('updateOrganizationWebsite failed', updateError);
      setError(t('organizationWebsite.saveError'));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <input
        type="url"
        value={value}
        placeholder={t('organizationWebsite.placeholder')}
        aria-label={t('organizationWebsite.label')}
        onChange={(event) => handleChange(event.target.value)}
        style={{
          padding: '0.35rem 0.6rem',
          border: '2px solid var(--stujo-border)',
          fontSize: '14px',
          minWidth: '14rem',
        }}
      />
      <button
        type="button"
        className="stujo-btn stujo-btn--small"
        disabled={!isValid || isUnchanged || loading}
        onClick={handleSave}
      >
        {t('organizationWebsite.save')}
      </button>
      {!isValid && (
        <span style={{ color: 'var(--stujo-error)', fontSize: '0.8rem' }}>
          {t('organizationWebsite.invalidUrl')}
        </span>
      )}
      {error && (
        <span style={{ color: 'var(--stujo-error)', fontSize: '0.8rem' }}>{error}</span>
      )}
      {saved && !error && (
        <span className="stujo-muted" style={{ fontSize: '0.8rem' }}>
          {t('organizationWebsite.saved')}
        </span>
      )}
    </div>
  );
};

export default OrganizationWebsiteEditor;
