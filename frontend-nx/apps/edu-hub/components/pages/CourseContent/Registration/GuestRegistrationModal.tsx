import { FC, useCallback, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { AuthRoles } from '../../../../types/enums';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { REGISTER_GUEST_FOR_COURSE } from '../../../../queries/guestRegistration';
import {
  RegisterGuestForCourse,
  RegisterGuestForCourseVariables,
} from '../../../../queries/__generated__/RegisterGuestForCourse';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { Button } from '../../../common/Button';

interface GuestRegistrationModalProps {
  visible: boolean;
  closeModal: () => void;
  course: Course_Course_by_pk;
}

/**
 * Registration form for visitors without an account.
 *
 * Collects the minimum needed to run the event - first name, last name, email -
 * and nothing else. Submitting does not register anyone: the backend mails a
 * confirmation link and the registration only exists once that link is used, so
 * an address typed by someone else never becomes a registration.
 *
 * The two checkboxes are deliberately separate and both start unticked. Terms
 * and privacy are a precondition for storing anything at all; the future-events
 * checkbox is marketing consent, which is only valid if it is freely given
 * (GDPR Art. 7(4)) - so registration must never depend on it.
 */
export const GuestRegistrationModal: FC<GuestRegistrationModalProps> = ({ visible, closeModal, course }) => {
  const t = useTranslations('guest');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  // Bots fill every field they find. A human never sees this one, so anything
  // in it means the submission is automated.
  const [honeypot, setHoneypot] = useState('');

  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [registerGuest, { loading }] = useRoleMutation<RegisterGuestForCourse, RegisterGuestForCourseVariables>(
    REGISTER_GUEST_FOR_COURSE,
    { context: { role: AuthRoles.anonymous } }
  );

  const resetForm = useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setAcceptTerms(false);
    setNewsletterOptIn(false);
    setHoneypot('');
    setErrorKey(null);
    setSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    closeModal();
  }, [closeModal, resetForm]);

  const handleSubmit = useCallback(async () => {
    setErrorKey(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorKey('errors.name_required');
      return;
    }
    if (!email.trim()) {
      setErrorKey('errors.email_required');
      return;
    }
    if (!acceptTerms) {
      setErrorKey('errors.terms_required');
      return;
    }

    try {
      const result = await registerGuest({
        variables: {
          courseId: course.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          acceptTerms,
          newsletterOptIn,
          // Forwarded rather than checked here: a script calling the action
          // directly never runs this component, so the server decides.
          website: honeypot,
        },
      });

      const response = result.data?.registerGuestForCourse;
      if (response?.success) {
        setSubmitted(true);
        return;
      }

      // The backend only rejects for reasons about the event or the input, not
      // about the address, so these are safe to show verbatim.
      setErrorKey(`errors.${(response?.messageKey ?? 'GUEST_REGISTRATION_FAILED').toLowerCase()}`);
    } catch {
      setErrorKey('errors.guest_registration_failed');
    }
  }, [acceptTerms, course.id, email, firstName, honeypot, lastName, newsletterOptIn, registerGuest]);

  return (
    <Dialog open={visible} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle className="flex items-center justify-between">
        <span>{submitted ? t('modal.check_your_inbox') : t('modal.title')}</span>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('modal.close')}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <MdClose />
        </button>
      </DialogTitle>

      <DialogContent dividers>
        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-label-primary">{t('modal.confirmation_sent', { email: email.trim() })}</p>
            <p className="text-sm text-label-secondary">{t('modal.confirmation_hint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-label-secondary">{t('modal.intro', { course: course.title })}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-label-primary">{t('modal.first_name')}</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  autoComplete="given-name"
                  className="border border-gray-300 rounded px-3 py-2 min-h-[44px]"
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-label-primary">{t('modal.last_name')}</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  autoComplete="family-name"
                  className="border border-gray-300 rounded px-3 py-2 min-h-[44px]"
                />
              </label>
            </div>

            <label className="flex flex-col text-sm">
              <span className="mb-1 text-label-primary">{t('modal.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="border border-gray-300 rounded px-3 py-2 min-h-[44px]"
              />
            </label>

            {/* Honeypot: hidden from people, irresistible to bots. Discarded server
                side in registerGuestForCourse. */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
              />
              <span className="text-sm text-label-primary leading-relaxed">
                {t.rich('modal.accept_terms', {
                  terms: (chunks) => (
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>

            {/* Separate from the terms box and never required: bundling marketing
                consent into registration would make it invalid. */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
              />
              <span className="text-sm text-label-primary leading-relaxed">{t('modal.newsletter_opt_in')}</span>
            </label>

            <p className="text-xs text-label-secondary leading-relaxed">{t('modal.data_notice')}</p>

            {errorKey && <p className="text-sm text-red-600">{t(errorKey)}</p>}
          </div>
        )}
      </DialogContent>

      <DialogActions>
        {submitted ? (
          <Button onClick={handleClose}>{t('modal.done')}</Button>
        ) : (
          <>
            <Button onClick={handleClose} inverted>
              {t('modal.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? t('modal.submitting') : t('modal.submit')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GuestRegistrationModal;
