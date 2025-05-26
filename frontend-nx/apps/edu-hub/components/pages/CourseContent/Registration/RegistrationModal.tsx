import { FC, useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MdClose } from 'react-icons/md';
import useTranslation from 'next-translate/useTranslation';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { Button } from '../../../common/Button';
import { getRegistrationTypeConfig, RegistrationFormData, RegistrationResult } from './types';

/**
 * Props for the RegistrationModal component
 */
interface RegistrationModalProps {
  /** Whether the modal is currently visible/open */
  visible: boolean;
  /** Callback function to close the modal */
  closeModal: () => void;
  /** Course data containing title, cost, and other registration details */
  course: Course_Course_by_pk;
  /** The type of registration process for this course */
  registrationType: CourseRegistrationType_enum;
  /**
   * Async function to handle form submission. Returns a result object
   * indicating success/failure and any error messages.
   */
  onSubmit: (formData: RegistrationFormData) => Promise<RegistrationResult>;
  /** Whether a registration request is currently in progress */
  isLoading: boolean;
}

/**
 * Modal component for course registration that requires user input.
 * Handles different registration types with appropriate form fields and validation.
 *
 * Features:
 * - Dynamic form fields based on registration type configuration
 * - Motivation letter input for approval-based registrations
 * - Terms acceptance checkbox for payment-required registrations
 * - Real-time form validation with error display
 * - Loading states with disabled form elements during submission
 * - Mobile-responsive design with full-screen modal on mobile
 * - Automatic form reset after successful submission
 * - Comprehensive error handling with user-friendly messages
 *
 * Form fields shown based on registration type:
 * - Motivation letter: Required for approval-based registrations
 * - Terms acceptance: Required for payment-based registrations
 * - Payment info: Displayed for courses that require payment
 *
 * Modal titles:
 * - "Apply for Course" (approval required)
 * - "Register for Course" (direct registration)
 * - "Register and Pay for Course" (payment required)
 *
 * @param props - The component props
 * @returns JSX element representing the registration modal
 */
export const RegistrationModal: FC<RegistrationModalProps> = ({
  visible,
  closeModal,
  course,
  registrationType,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation('course');
  const [motivationLetter, setMotivationLetter] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = getRegistrationTypeConfig(registrationType);

  const handleSubmit = useCallback(async () => {
    if (config.requiresInput && !motivationLetter.trim()) {
      setError(t('errors.motivation_letter_required'));
      return;
    }

    if (config.requiresPayment && !acceptTerms) {
      setError(t('errors.terms_required'));
      return;
    }

    setError(null);

    const result = await onSubmit({
      motivationLetter: motivationLetter.trim(),
      acceptTerms,
    });

    if (result.success) {
      // Close modal and reset form after a short delay to allow success notification
      setTimeout(() => {
        closeModal();
        setMotivationLetter('');
        setAcceptTerms(false);
      }, 500);
    } else {
      setError(result.error || t('errors.registration_failed'));
    }
  }, [config, motivationLetter, acceptTerms, onSubmit, t, closeModal]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      closeModal();
      setError(null);
      setMotivationLetter('');
      setAcceptTerms(false);
    }
  }, [isLoading, closeModal]);

  const getModalTitle = () => {
    if (config.requiresPayment) {
      return t('modal.title_with_payment');
    }
    if (config.isDirect) {
      return t('modal.title_direct');
    }
    return t('modal.title_approval');
  };

  const isSubmitDisabled =
    isLoading || (config.requiresInput && !motivationLetter.trim()) || (config.requiresPayment && !acceptTerms);

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          minHeight: '480px',
          maxHeight: '90vh',
          margin: { xs: 0, sm: 2 },
          '@media (max-width: 600px)': {
            margin: 0,
            maxHeight: '100vh',
            borderRadius: 0,
            width: '100%',
            maxWidth: '100%',
          },
        },
      }}
    >
      <DialogTitle sx={{ padding: { xs: '16px', sm: '24px' } }}>
        <div className="flex justify-between items-center">
          <span className="text-lg sm:text-xl font-semibold pr-4">{getModalTitle()}</span>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label={t('modal.close')}
            disabled={isLoading}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent sx={{ padding: { xs: '0 16px', sm: '0 24px' } }}>
        <div className="mb-4">
          <p className="text-gray-600 font-medium text-sm sm:text-base">{course.title}</p>
        </div>

        {config.requiresInput && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('modal.motivation_letter_label')}</label>
            <textarea
              value={motivationLetter}
              onChange={(e) => setMotivationLetter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              rows={7}
              placeholder={t('modal.motivation_letter_placeholder')}
              disabled={isLoading}
            />
          </div>
        )}

        {config.requiresPayment && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4 mb-4">
              <p className="text-sm text-yellow-800">{t('modal.payment_info', { cost: course.cost })}</p>
            </div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 leading-relaxed">{t('modal.accept_terms')}</span>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ padding: { xs: '16px', sm: '24px' }, paddingTop: 0 }}>
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 w-full">
          <Button onClick={handleClose} disabled={isLoading} className="px-6 py-3 w-full sm:w-auto order-2 sm:order-1">
            {t('modal.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            filled
            disabled={isSubmitDisabled}
            className="px-6 py-3 min-w-[140px] font-medium w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('modal.submitting')}</span>
              </div>
            ) : config.requiresPayment ? (
              t('modal.proceed_to_payment')
            ) : (
              t('modal.submit')
            )}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};
