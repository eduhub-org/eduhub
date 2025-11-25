import React, { useState } from 'react';
import { Dialog, DialogTitle, Checkbox, FormControlLabel } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { Button } from '../../common/Button';
import InputField from '../../inputs/InputField';
import useTranslation from 'next-translate/useTranslation';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { CREATE_USER } from '../../../queries/user';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('manageUsers');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true); // Default to true
  const [error, setError] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const [createUser, { loading }] = useAdminMutation(CREATE_USER, {
    onCompleted: (data) => {
      if (data?.createUser?.success) {
        setShowSuccessNotification(true);
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setSendEmail(true);
        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
          onSuccess(); // Trigger refetch
        }, 1500);
      } else {
        setError(data?.createUser?.error || t('create_user_error'));
      }
    },
    onError: (err) => {
      setError(err.message || t('create_user_error'));
    },
  });

  const handleSubmit = () => {
    // Reset error
    setError(null);

    // Validate inputs
    if (!firstName.trim()) {
      setError(t('create_user_error_first_name_required'));
      return;
    }

    if (!lastName.trim()) {
      setError(t('create_user_error_last_name_required'));
      return;
    }

    if (!email.trim()) {
      setError(t('create_user_error_email_required'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('create_user_error_email_invalid'));
      return;
    }

    createUser({
      variables: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        sendEmail: sendEmail,
      },
    });
  };

  const handleClose = () => {
    if (!loading) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setSendEmail(true);
      setError(null);
      onClose();
    }
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim();

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="create-user-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="create-user-dialog-title">
          <div className="flex justify-between items-center">
            <span>{t('create_user_dialog_title')}</span>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={t('close')}
              disabled={loading}
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </DialogTitle>

        <div className="px-6 pb-6">
          <div className="mb-6 space-y-4">
            <div>
              <InputField
                variant="material"
                type="input"
                label={t('first_name')}
                placeholder={t('first_name_placeholder')}
                itemId={0}
                value={firstName}
                onValueUpdated={(data) => setFirstName(data.text || '')}
                className="w-full"
              />
            </div>

            <div>
              <InputField
                variant="material"
                type="input"
                label={t('last_name')}
                placeholder={t('last_name_placeholder')}
                itemId={0}
                value={lastName}
                onValueUpdated={(data) => setLastName(data.text || '')}
                className="w-full"
              />
            </div>

            <div>
              <InputField
                variant="material"
                type="email"
                label={t('email')}
                placeholder={t('email_placeholder')}
                itemId={0}
                value={email}
                onValueUpdated={(data) => setEmail(data.text || '')}
                className="w-full"
              />
            </div>

            <div className="mt-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('send_welcome_email')}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              filled
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
            >
              {loading ? t('creating') : t('create_user')}
            </Button>
          </div>
        </div>
      </Dialog>

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={t('create_user_success')}
      />

      <ErrorMessageDialog
        errorMessage={error}
        open={!!error}
        onClose={() => setError(null)}
      />
    </>
  );
};

