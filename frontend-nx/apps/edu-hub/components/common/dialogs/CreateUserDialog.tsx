import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, Checkbox, FormControlLabel } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { Button } from '../Button';
import InputField from '../../inputs/InputField';
import { useTranslations, useLocale } from 'next-intl';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { CREATE_USER } from '../../../queries/user';
import NotificationSnackbar from './NotificationSnackbar';
import { ErrorMessageDialog } from './ErrorMessageDialog';
import { CreateUser } from '../../../queries/__generated__/CreateUser';

type CreateUserVariables = {
  firstName: string;
  lastName: string;
  email: string;
  sendEmail: boolean;
};

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onUserCreated?: (userId: string, firstName: string, lastName: string, email: string) => void;
  initialFirstName?: string;
  initialLastName?: string;
  initialEmail?: string;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onUserCreated,
  initialFirstName = '',
  initialLastName = '',
  initialEmail = '',
}) => {
  const t = useTranslations('manageUsers');
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [sendEmail, setSendEmail] = useState(true); // Default to true
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update form fields when initial values change
  useEffect(() => {
    if (open) {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setEmail(initialEmail);
    }
  }, [open, initialFirstName, initialLastName, initialEmail]);

  // Clear timeout on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const [createUser, { loading }] = useRoleMutation<CreateUser, CreateUserVariables>(CREATE_USER, {
    onCompleted: (data) => {
      if (data?.createUser?.success) {
        setShowSuccessNotification(true);
        
        // Call onUserCreated callback if provided
        if (onUserCreated && data.createUser.userId) {
          onUserCreated(
            data.createUser.userId,
            firstName.trim(),
            lastName.trim(),
            email.trim()
          );
        }
        
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setSendEmail(true);
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // Close dialog after a short delay
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          onClose();
          onSuccess(); // Trigger refetch
        }, 1500);
      } else {
        setServerError(data?.createUser?.error || t('create_user.error'));
      }
    },
    onError: (err) => {
      setServerError(err.message || t('create_user.error'));
    },
  });

  const handleSubmit = () => {
    // Reset errors
    setValidationError(null);
    setServerError(null);

    // Validate inputs
    if (!firstName.trim()) {
      setValidationError(t('create_user.error_first_name_required'));
      return;
    }

    if (!lastName.trim()) {
      setValidationError(t('create_user.error_last_name_required'));
      return;
    }

    if (!email.trim()) {
      setValidationError(t('create_user.error_email_required'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError(t('create_user.error_email_invalid'));
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
      // Clear timeout if dialog is closed early
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setSendEmail(true);
      setValidationError(null);
      setServerError(null);
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
            <span>{t('create_user.dialog_title')}</span>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={t('common.close')}
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
                placeholder={t('create_user.first_name_placeholder')}
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
                placeholder={t('create_user.last_name_placeholder')}
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
                placeholder={t('create_user.email_placeholder')}
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
                label={t('create_user.send_welcome_email')}
              />
            </div>

            {validationError && (
              <div className="text-red-600 text-sm mt-2">{validationError}</div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={loading}>
              {t('create_user.cancel')}
            </Button>
            <Button
              filled
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
            >
              {loading ? t('create_user.creating') : t('create_user.button')}
            </Button>
          </div>
        </div>
      </Dialog>

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={t('create_user.success')}
      />

      <ErrorMessageDialog
        errorMessage={serverError}
        open={!!serverError}
        onClose={() => setServerError(null)}
      />
    </>
  );
};

