import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

type Props = {
  organizationId: number;
  initiallyConfigured: boolean;
};

export const GhostNewsletterCredentialManager: React.FC<Props> = ({
  organizationId,
  initiallyConfigured,
}) => {
  const t = useTranslations('manageOrganizations');
  const { data: session } = useSession();

  const [credential, setCredential] = useState('');
  const [isConfigured, setIsConfigured] = useState(initiallyConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCredential = async (nextCredential: string) => {
    if (!session?.accessToken) {
      setError(t('organization.newsletter_api_key_error_auth'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/manage-organizations/ghost-newsletter-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          organizationId,
          credential: nextCredential,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || t('organization.newsletter_api_key_error_generic'));
      }

      setIsConfigured(Boolean(data.configured));
      setCredential('');
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t('organization.newsletter_api_key_error_generic');
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1">
        <label htmlFor={`ghost-api-key-${organizationId}`} className="text-sm font-medium text-label-primary">
          {t('organization.newsletter_api_key')}
        </label>
        <Tooltip title={t('help.newsletter_api_key')} placement="top">
          <HelpOutline fontSize="small" style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }} />
        </Tooltip>
      </div>
      <input
        id={`ghost-api-key-${organizationId}`}
        type="password"
        className="mt-1 w-full border-b border-border-primary bg-transparent py-2 text-sm text-label-primary focus:outline-none"
        placeholder={t('organization.newsletter_api_key_placeholder')}
        value={credential}
        onChange={(event) => setCredential(event.target.value)}
        disabled={isSaving}
        autoComplete="off"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="rounded bg-edu-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          disabled={isSaving || credential.trim().length === 0}
          onClick={() => void saveCredential(credential.trim())}
        >
          {isConfigured ? t('organization.newsletter_api_key_rotate') : t('organization.newsletter_api_key_set')}
        </button>

        {isConfigured && (
          <button
            type="button"
            className="rounded bg-edu-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void saveCredential('')}
          >
            {t('organization.newsletter_api_key_remove')}
          </button>
        )}

        <span className="text-xs text-label-secondary">
          {isConfigured
            ? t('organization.newsletter_api_key_status_configured')
            : t('organization.newsletter_api_key_status_missing')}
        </span>
      </div>

      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
    </div>
  );
};
