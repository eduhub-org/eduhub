import { FC, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../hooks/authedMutation';
import useLogout from '../../../hooks/logout';
import { useViewAs } from '../../../hooks/viewAs';
import { DELETE_MY_ACCOUNT } from '../../../queries/user';
import type { DeleteMyAccount } from '../../../queries/__generated__/DeleteMyAccount';
import { Button } from '../../common/Button';
import { DialogShell } from '../../common/dialogs/DialogShell';

interface DeleteAccountSectionProps {
  email: string;
}

const DeleteAccountSection: FC<DeleteAccountSectionProps> = ({ email }) => {
  const t = useTranslations('profile.DeleteAccount');
  const tCommon = useTranslations('common');
  const { asPlainUser } = useViewAs();
  const logout = useLogout();
  const [deleteMyAccount] = useRoleMutation<DeleteMyAccount>(DELETE_MY_ACCOUNT);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const submitting = useRef(false);
  const confirmed = Boolean(email) && confirmation.trim().toLowerCase() === email.trim().toLowerCase();

  // Never offer account deletion while viewing another person's account.
  if (asPlainUser) return null;

  const close = () => {
    if (submitting.current) return;
    setOpen(false);
    setConfirmation('');
    setError(false);
  };

  const handleDelete = async () => {
    if (!confirmed || submitting.current) return;
    submitting.current = true;
    setDeleting(true);
    setError(false);
    try {
      const result = await deleteMyAccount();
      if (result.errors?.length || result.data?.deleteMyAccount?.error ||
          result.data?.deleteMyAccount?.messageKey !== 'ANONYMIZATION_SUCCESS') {
        throw new Error('Account deletion incomplete');
      }
    } catch {
      setError(true);
      submitting.current = false;
      setDeleting(false);
      return;
    }
    await logout();
  };

  return (
    <section className="mt-12 mb-8" aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading" className="text-xl font-semibold text-red-600">
        {t('title')}
      </h2>
      <div className="mt-3 rounded-xl border border-red-500 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-label-secondary">{t('description')}</p>
          <p className="mt-2 text-sm font-semibold text-red-600">{t('certificates_warning')}</p>
        </div>
        <Button
          type="button"
          className="!border-red-600 !text-red-600 hover:!bg-red-50 shrink-0 min-h-11"
          disabled={!email}
          onClick={() => setOpen(true)}
        >
          {t('delete_button')}
        </Button>
      </div>
      <DialogShell
        open={open}
        onClose={close}
        title={t('confirmation_title')}
        borderRadius="16px"
        ariaLabelledBy="delete-account-dialog-title"
        actions={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button type="button" onClick={close} disabled={deleting}>{tCommon('cancel')}</Button>
            <Button
              type="button"
              className="!border-red-600 !bg-red-600 !text-white hover:!bg-red-700 min-h-11 disabled:!bg-gray-400 disabled:!border-gray-400"
              onClick={() => void handleDelete()}
              disabled={!confirmed || deleting}
            >
              {deleting ? t('deleting') : t('confirm_button')}
            </Button>
          </div>
        }
      >
        <p>{t('confirmation_description')}</p>
        <p className="mt-3 font-semibold text-red-600">{t('certificates_warning')}</p>
        <p className="mt-3">{t('connected_services')}</p>
        <p className="mt-3 text-sm">{t('retained_records')}</p>
        <label htmlFor="delete-account-email" className="mt-5 block text-sm font-semibold">
          {t('type_email', { email })}
        </label>
        <input
          id="delete-account-email"
          type="email"
          autoComplete="off"
          value={confirmation}
          disabled={deleting}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-2 w-full min-h-11 rounded border border-gray-400 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{t('error')}</p>}
      </DialogShell>
    </section>
  );
};

export default DeleteAccountSection;
