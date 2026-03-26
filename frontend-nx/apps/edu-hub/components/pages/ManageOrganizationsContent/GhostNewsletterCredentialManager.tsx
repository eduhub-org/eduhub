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
  /** Called after credential save/remove succeeds so parent can sync related fields (e.g. newsletter provider). */
  onCredentialSaved?: () => void;
};

export const GhostNewsletterCredentialManager: React.FC<Props> = ({
  organizationId,
  initiallyConfigured,
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
      setShowSuccessSnackbar(true);
      onCredentialSaved?.();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t('organization.newsletter_api_key_error_generic');
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
        label={t('organization.newsletter_api_key')}
        placeholder={t('organization.newsletter_api_key_placeholder')}
        itemId={organizationId}
        value={credential}
        helpText={t('help.newsletter_api_key')}
        debounceTimeout={0}
        showCharacterCount={false}
        onValueUpdated={(data) => {
          setCredential(typeof data?.text === 'string' ? data.text : '');
        }}
        disabled={isSaving}
        inputProps={{
          id: `ghost-api-key-${organizationId}`,
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
          {isConfigured ? t('organization.newsletter_api_key_rotate') : t('organization.newsletter_api_key_set')}
        </Button>

        {isConfigured && (
          <Button
            className="border-red-600 text-red-700 hover:border-red-700"
            disabled={isSaving}
            onClick={() => setShowConfirmRemove(true)}
          >
            {t('organization.newsletter_api_key_remove')}
          </Button>
        )}

        <span className="text-xs text-label-secondary">
          {isConfigured
            ? t('organization.newsletter_api_key_status_configured')
            : t('organization.newsletter_api_key_status_missing')}
        </span>
      </div>

      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
      <QuestionConfirmationDialog
        open={showConfirmRemove}
        question={t('organization.newsletter_api_key_remove_confirm')}
        onClose={() => setShowConfirmRemove(false)}
        onConfirm={handleConfirmRemove}
      />
      <NotificationSnackbar
        open={showSuccessSnackbar}
        onClose={() => setShowSuccessSnackbar(false)}
        message={t('organization.newsletter_api_key_save_success')}
      />
    </div>
  );
};
