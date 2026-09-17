import { useMutation } from '@apollo/client';
import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ACTION_ROLE_CONTEXT, UPDATE_ORGANIZATION_WEBSITE_ACTION } from '../lib/employer';
import { isAbsoluteHttpUrl } from '../lib/website';
import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organization: EmployerOrganization;
  onWebsiteUpdated: () => void;
}

const INPUT_ID = 'stujo-organization-website';
const MESSAGE_ID = `${INPUT_ID}-message`;

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  UNAUTHORIZED: 'organizationWebsite.permissionDenied',
  INVALID_INPUT: 'organizationWebsite.invalidUrl',
};

/**
 * Website field inside the company profile dialog. The dashboard header
 * shows the stored value as a link; this is where it is changed.
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
const OrganizationWebsiteField: FC<Props> = ({ organization, onWebsiteUpdated }) => {
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
    <div className="stujo-field">
      <label htmlFor={INPUT_ID}>{t('organizationWebsite.label')}</label>
      <input
        id={INPUT_ID}
        type="url"
        inputMode="url"
        autoComplete="url"
        value={value}
        placeholder={t('organizationWebsite.placeholder')}
        aria-invalid={!isValid}
        aria-describedby={!isValid || error ? MESSAGE_ID : undefined}
        onChange={(event) => handleChange(event.target.value)}
      />
      <p className="stujo-field-hint">{t('organizationWebsite.hint')}</p>
      <div className="stujo-field-actions">
        <button
          type="button"
          className="stujo-btn stujo-btn--small"
          disabled={!isValid || isUnchanged || loading}
          onClick={handleSave}
        >
          {t('organizationWebsite.save')}
        </button>
        {saved && !error && <span className="stujo-muted">{t('organizationWebsite.saved')}</span>}
      </div>
      {(!isValid || error) && (
        <p id={MESSAGE_ID} className="stujo-field-error" role="alert">
          {!isValid ? t('organizationWebsite.invalidUrl') : error}
        </p>
      )}
    </div>
  );
};

export default OrganizationWebsiteField;
