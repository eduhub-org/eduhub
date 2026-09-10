import React, { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import { UPDATE_ORGANIZATION_API_KEY_HASH } from '../../../queries/organization';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';

type Props = {
  organization: OrganizationList_Organization;
  onError: (message: string) => void;
};

// Lightweight SHA-256 hashing using Web Crypto API
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generatePlainApiKey(organizationId: number): string {
  try {
    const webCrypto: Crypto | undefined =
      typeof window !== 'undefined' && (window as any).crypto && (window as any).crypto.getRandomValues
        ? (window as any).crypto
        : typeof self !== 'undefined' && (self as any).crypto && (self as any).crypto.getRandomValues
          ? (self as any).crypto
          : undefined;
    let bytes: Uint8Array;
    if (webCrypto) {
      bytes = webCrypto.getRandomValues(new Uint8Array(16));
    } else {
      // Fallback for environments without Web Crypto (should be rare)
      bytes = new Uint8Array(16);
      for (let i = 0; i < 16; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const secret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `edh_live_org${organizationId}_sk_${secret}`;
  } catch {
    // Last-resort fallback
    const secret = `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`.slice(0, 32);
    return `edh_live_org${organizationId}_sk_${secret}`;
  }
}

export const ApiKeyManager: React.FC<Props> = ({ organization, onError }) => {
  const t = useTranslations('manageOrganizations');
  const [showDialog, setShowDialog] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingStore, setPendingStore] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegeneration, setIsRegeneration] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(Boolean(organization.Settings?.apiKeyHash));
  const [revokeOpen, setRevokeOpen] = useState(false);

  const [updateApiKeyHash] = useRoleMutation(UPDATE_ORGANIZATION_API_KEY_HASH);

  const hasExistingKey = useMemo(() => hasKey, [hasKey]);
  const actionLabel = pending
    ? hasExistingKey
      ? t('api_key.action.regenerating')
      : t('api_key.action.generating')
    : hasExistingKey
      ? t('api_key.action.regenerate')
      : t('api_key.action.generate');

  const onGenerate = useCallback(async () => {
    try {
      setPending(true);
      // Generate plaintext API key and show dialog immediately
      setIsRegeneration(hasExistingKey);
      const plainKey = generatePlainApiKey(organization.id);
      setGeneratedKey(plainKey);
      setShowDialog(true);
    } catch {
      const message = t('api_key.error.generate_failed');
      setError(message);
      onError(message);
      // eslint-disable-next-line no-console
      console.error('API key generation failed');
    } finally {
      setPending(false);
    }
  }, [organization.id, t, onError, hasExistingKey]);

  const persistHash = useCallback(async () => {
    if (!generatedKey) return;
    try {
      setPendingStore(true);
      const hash = await sha256(generatedKey);
      await updateApiKeyHash({ variables: { id: organization.id, apiKeyHash: hash } });
      setHasKey(true);
    } catch (e) {
      const message = t('api_key.error.generate_failed');
      setError(message);
      onError(message);
      // eslint-disable-next-line no-console
      console.error('API key store failed', e);
    } finally {
      setPendingStore(false);
      setGeneratedKey(null);
    }
  }, [generatedKey, organization.id, t, updateApiKeyHash, onError]);

  const onButtonClick = useCallback(() => {
    void onGenerate();
  }, [onGenerate]);

  const onRevoke = useCallback(async () => {
    try {
      setPendingRevoke(true);
      await updateApiKeyHash({ variables: { id: organization.id, apiKeyHash: null } });
      setHasKey(false);
      setRevokeOpen(false);
    } catch (e) {
      const message = t('api_key.error.revoke_failed');
      setError(message);
      onError(message);
      // eslint-disable-next-line no-console
      console.error('API key revoke failed', e);
    } finally {
      setPendingRevoke(false);
    }
  }, [organization.id, t, updateApiKeyHash, onError]);

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{t('api_key.title')}</div>
          <div className="text-sm text-gray-600">{t('api_key.description')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-white ${pending ? 'bg-gray-400' : 'bg-edu-green hover:opacity-90'}`}
            onClick={onButtonClick}
            disabled={pending || pendingStore}
          >
            {actionLabel}
          </button>
          {hasExistingKey && (
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-white ${pendingRevoke ? 'bg-gray-400' : 'bg-edu-red hover:opacity-90'}`}
              onClick={() => setRevokeOpen(true)}
              disabled={pending || pendingStore || pendingRevoke}
            >
              {pendingRevoke ? t('api_key.action.revoking') : t('api_key.action.revoke')}
            </button>
          )}
        </div>
      </div>
      {/* Revoke button indicates active key */}

      {/* Regenerate confirmation removed; warning shown inside dialog instead */}

      {/* One-time display dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="text-lg font-semibold mb-2">{t('api_key.dialog.title')}</div>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded mb-4">
              <div className="font-medium">{t('api_key.dialog.warning.title')}</div>
              <div className="text-sm">{t('api_key.dialog.warning.description')}</div>
            </div>
            {isRegeneration && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">
                <div className="text-sm">{t('api_key.confirm.regenerate')}</div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">{t('api_key.dialog.key_label')}</div>
              <div className="flex items-center gap-2">
                <code className="text-xs break-all bg-gray-100 px-2 py-1 rounded flex-1">{generatedKey}</code>
                <button
                  type="button"
                  className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => generatedKey && navigator.clipboard.writeText(generatedKey)}
                >
                  {t('api_key.dialog.copy')}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowDialog(false);
                  setGeneratedKey(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-edu-green text-white hover:opacity-90 disabled:opacity-60"
                onClick={() => {
                  void persistHash();
                  setShowDialog(false);
                }}
                disabled={pendingStore}
              >
                {pendingStore ? t('api_key.dialog.saving') : t('api_key.dialog.confirm_saved')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm revoke */}
      <QuestionConfirmationDialog
        open={revokeOpen}
        question={t('api_key.confirm.revoke')}
        onConfirm={() => void onRevoke()}
        onClose={() => setRevokeOpen(false)}
      />

      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
    </div>
  );
};

export default ApiKeyManager;
