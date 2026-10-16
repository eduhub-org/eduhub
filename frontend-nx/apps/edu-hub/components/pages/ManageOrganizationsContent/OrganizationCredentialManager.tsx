import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import InputField from '../../inputs/InputField';
import { Button } from '../../common/Button';

type Props = {
  organizationId: number;
  initiallyConfigured: boolean;
  /** API route that encrypts and stores the credential, e.g. /api/manage-organizations/ghost-newsletter-credential */
  endpoint: string;
  /**
   * Translation key prefix: labels are read from manageOrganizations.organization.<prefix>, <prefix>_placeholder,
   * _set, _rotate, _remove, _remove_confirm, _status_configured, _status_missing, _save_success, _error_auth,
   * _error_generic, and the help text from manageOrganizations.help.<prefix>.
   */
  translationPrefix: string;
  /** Called after credential save/remove succeeds so parent can sync related fields (e.g. newsletter provider). */
  onCredentialSaved?: () => void;
};

/** Write-only input for an organization's encrypted integration credential (Ghost, Rausgegangen). */
export const OrganizationCredentialManager: React.FC<Props> = ({
  organizationId,
  initiallyConfigured,
  endpoint,
  translationPrefix: prefix,
  onCredentialSaved,
}) => {
  const t = useTranslations('manageOrganizations');
  const { data: session } = useSession();

  const [credential, setCredential] = useState('');
  const [isConfigured, setIsConfigured] = useState(initiallyConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const saveCredential = async (nextCredential: string) => {
    if (!session?.accessToken) {
      setError(t(`organization.${prefix}_error_auth`));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(endpoint, {
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
        throw new Error(data?.error || t(`organization.${prefix}_error_generic`));
      }

      setIsConfigured(Boolean(data.configured));
      setCredential('');
      setShowSuccessSnackbar(true);
      onCredentialSaved?.();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t(`organization.${prefix}_error_generic`);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = () => {
    setShowConfirmRemove(false);
    void saveCredential('');
  };

  return (
    <div className="mt-3">
      <InputField
        variant="material"
        type="input"
        label={t(`organization.${prefix}`)}
        placeholder={t(`organization.${prefix}_placeholder`)}
        itemId={organizationId}
        value={credential}
        helpText={t(`help.${prefix}`)}
        debounceTimeout={0}
        showCharacterCount={false}
        onValueUpdated={(data) => {
          setCredential(typeof data?.text === 'string' ? data.text : '');
        }}
        disabled={isSaving}
        inputProps={{
          id: `${prefix}-${organizationId}`,
          type: 'password',
          autoComplete: 'off',
        }}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          filled
          disabled={isSaving || credential.trim().length === 0}
          onClick={() => void saveCredential(credential.trim())}
        >
          {isConfigured ? t(`organization.${prefix}_rotate`) : t(`organization.${prefix}_set`)}
        </Button>

        {isConfigured && (
          <Button
            className="border-red-600 text-red-700 hover:border-red-700"
            disabled={isSaving}
            onClick={() => setShowConfirmRemove(true)}
          >
            {t(`organization.${prefix}_remove`)}
          </Button>
        )}

        <span className="text-xs text-label-secondary">
          {isConfigured
            ? t(`organization.${prefix}_status_configured`)
            : t(`organization.${prefix}_status_missing`)}
        </span>
      </div>

      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
      <QuestionConfirmationDialog
        open={showConfirmRemove}
        question={t(`organization.${prefix}_remove_confirm`)}
        onClose={() => setShowConfirmRemove(false)}
        onConfirm={handleConfirmRemove}
      />
      <NotificationSnackbar
        open={showSuccessSnackbar}
        onClose={() => setShowSuccessSnackbar(false)}
        message={t(`organization.${prefix}_save_success`)}
      />
    </div>
  );
};
