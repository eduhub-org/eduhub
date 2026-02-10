import { FC, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { Button } from '../../../common/Button';
import { FormbricksSurveyEmbed } from '../../../common/FormbricksSurveyEmbed';
import { useUserId } from '../../../../hooks/user';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { getRegistrationTypeConfig, RegistrationFormData, RegistrationResult } from './types';
import { CREATE_ENROLLMENT_WITH_ADDONS, GET_FORMBRICKS_RESPONSES } from '../../../../queries/formbricks';
import { CreateEnrollmentWithAddons, CreateEnrollmentWithAddonsVariables } from '../../../../queries/__generated__/CreateEnrollmentWithAddons';
import { GetFormbricksResponses, GetFormbricksResponsesVariables } from '../../../../queries/__generated__/GetFormbricksResponses';

type ModalStep = 'questionnaire' | 'summary';

/**
 * Props for the RegistrationModal component
 */
interface RegistrationModalProps {
  /** Whether the modal is currently visible/open */
  visible: boolean;
  /** Callback function to close the modal */
  closeModal: () => void;
  /** Course data containing title, basePrice, and other registration details */
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
  /** Optional enrollment ID for retry payment flow - triggers prefilled survey */
  retryEnrollmentId?: number | null;
}

/**
 * Modal component for course registration that requires user input.
 * Handles different registration types with appropriate form fields and validation.
 *
 * Features:
 * - Multi-step flow for payment registrations (questionnaire → summary)
 * - Dynamic form fields based on registration type configuration
 * - Motivation letter input for approval-based registrations
 * - Pricing summary with base price and add-ons for payment registrations
 * - Terms acceptance checkbox for payment-required registrations
 * - Real-time form validation with error display
 * - Loading states with disabled form elements during submission
 * - Mobile-responsive design with full-screen modal on mobile
 * - Automatic form reset after successful submission
 * - Comprehensive error handling with user-friendly messages
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
  retryEnrollmentId,
}) => {
  const t = useTranslations('course');
  const router = useRouter();
  const locale = router?.locale || 'de';
  const userId = useUserId();
  const [motivationLetter, setMotivationLetter] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formbricksSurveyCompleted, setFormbricksSurveyCompleted] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Array<{ id: number; description: string; validatedPrice: number; currency: string; questionId: string; choiceId: string }>>([]);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [isFetchingAddons, setIsFetchingAddons] = useState(false);

  const config = getRegistrationTypeConfig(registrationType);
  
  // Mutation for creating enrollment with addons
  const [createEnrollmentWithAddons] = useRoleMutation<CreateEnrollmentWithAddons, CreateEnrollmentWithAddonsVariables>(
    CREATE_ENROLLMENT_WITH_ADDONS
  );
  
  // Get effective Formbricks survey URL (course-level overrides program default)
  const effectiveSurveyUrl = course.formbricksEnrollmentSurveyUrl || course.Program?.defaultFormbricksEnrollmentSurveyUrl || null;
  const hasFormbricksSurvey = !!effectiveSurveyUrl;
  const useFormbricks = hasFormbricksSurvey && config.requiresInput;

  // Fetch previous responses for retry flow to build prefilled URL
  const shouldFetchResponses = !!(retryEnrollmentId && effectiveSurveyUrl && userId);
  const { data: formbricksResponsesData } = useRoleQuery<GetFormbricksResponses, GetFormbricksResponsesVariables>(
    GET_FORMBRICKS_RESPONSES,
    {
      variables: {
        courseId: course.id,
        userId: userId ?? 0,
        enrollmentId: retryEnrollmentId || undefined,
        formbricksSurveyUrl: effectiveSurveyUrl || '',
      },
      skip: !shouldFetchResponses,
      fetchPolicy: 'network-only',
    }
  );

  // Build prefilled survey URL from previous responses
  const prefilledSurveyUrl = useMemo(() => {
    if (!retryEnrollmentId || !effectiveSurveyUrl || !formbricksResponsesData?.getFormbricksResponses?.success) {
      return null;
    }

    const responses = formbricksResponsesData.getFormbricksResponses.responses;
    if (!responses || responses.length === 0) {
      return null;
    }

    const latestResponse = responses[0];
    let url: URL;
    try {
      url = new URL(effectiveSurveyUrl);
    } catch {
      // Invalid URL - return null to fall back to non-prefilled URL
      return null;
    }
    
    // Add prefill parameters from response answers
    // Use rawAnswer which contains the actual values (not formatted strings with prices)
    latestResponse.answers?.forEach((answer) => {
      if (answer.questionId) {
        // rawAnswer can be a string (single-select) or JSON string of array (multi-select)
        // Prefer rawAnswer over answer since it doesn't include price formatting
        const rawValue = answer.rawAnswer ?? answer.answer;
        
        if (!rawValue) {
          return;
        }
        
        // Handle different formats:
        // 1. If it's already an array (shouldn't happen per GraphQL types, but handle it)
        if (Array.isArray(rawValue)) {
          rawValue.forEach((val) => {
            if (val) {
              url.searchParams.append(answer.questionId, String(val));
            }
          });
          return;
        }
        
        // 2. Try to parse as JSON (for multi-select arrays stored as JSON strings)
        try {
          const parsed = JSON.parse(String(rawValue));
          if (Array.isArray(parsed)) {
            // Multi-select: append each value
            parsed.forEach((val) => {
              if (val) {
                url.searchParams.append(answer.questionId, String(val));
              }
            });
          } else {
            // Single value from JSON parse
            url.searchParams.set(answer.questionId, String(parsed));
          }
        } catch {
          // 3. Not JSON, treat as single string value
          url.searchParams.set(answer.questionId, String(rawValue));
        }
      }
    });
    
    return url.toString();
  }, [retryEnrollmentId, effectiveSurveyUrl, formbricksResponsesData]);

  // Determine current step for payment flows
  const currentStep: ModalStep = useMemo(() => {
    if (!config.requiresPayment) {
      // Non-payment flows don't use steps
      return 'questionnaire';
    }
    // For payment flows: show questionnaire first if it requires input, otherwise go straight to summary
    if (config.requiresInput && useFormbricks && !formbricksSurveyCompleted) {
      return 'questionnaire';
    }
    return 'summary';
  }, [config, useFormbricks, formbricksSurveyCompleted]);

  // Format price helper
  const formatPrice = useCallback((priceInCents: number, currency: string): string => {
    const price = priceInCents / 100;
    const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(price)} ${currency}`;
  }, [locale]);

  // Calculate pricing
  const basePrice = course.basePrice || 0;
  const currency = course.currency || 'EUR';
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.validatedPrice, 0);
  const totalPrice = basePrice + addonsTotal;

  // Validate currency consistency
  const currencyMismatch = useMemo(() => {
    if (selectedAddons.length === 0) return false;
    return selectedAddons.some(addon => addon.currency !== currency);
  }, [selectedAddons, currency]);

  const handleFormbricksComplete = useCallback(async () => {
    // Guard against duplicate submissions
    if (isLoading || formbricksSurveyCompleted) {
      return;
    }
    
    setFormbricksSurveyCompleted(true);
    
    // For payment flows, create enrollment with addons and show summary
    if (config.requiresPayment && effectiveSurveyUrl && userId) {
      setIsFetchingAddons(true);
      try {
        const result = await createEnrollmentWithAddons({
          variables: {
            courseId: course.id,
            userId: userId,
            motivationLetter: '[Formbricks Survey Completed]',
            formbricksSurveyUrl: effectiveSurveyUrl,
            // Terms not accepted yet - will be accepted in summary step
            // termsAcceptedAt is set when user accepts terms in handleSubmit
          },
        });

        if (result.data?.createEnrollmentWithAddons?.success) {
          const enrollmentId = result.data.createEnrollmentWithAddons.enrollmentId;
          const addons = result.data.createEnrollmentWithAddons.selectedAddons || [];
          
          if (enrollmentId) {
            setEnrollmentId(enrollmentId);
          }
          setSelectedAddons(addons);
        } else {
          setSelectedAddons([]);
          setError(result.data?.createEnrollmentWithAddons?.error || t('errors.registration_failed'));
        }
      } catch (error: any) {
        console.error('Error creating enrollment with addons:', error);
        setSelectedAddons([]);
        setError(error.message || t('errors.registration_failed'));
      } finally {
        setIsFetchingAddons(false);
      }
    } else if (!config.requiresPayment) {
      // For non-payment flows, auto-submit
      try {
        const result = await onSubmit({
          motivationLetter: '[Formbricks Survey Completed]',
          acceptTerms: false,
        });
        if (result.success) {
          closeModal();
        } else {
          setError(result.error || t('errors.registration_failed'));
        }
      } catch (err: any) {
        setError(err.message || t('errors.registration_failed'));
      }
    } else {
      // Payment flow but no survey URL - proceed with empty addons
      setSelectedAddons([]);
    }
  }, [onSubmit, closeModal, t, isLoading, formbricksSurveyCompleted, config, effectiveSurveyUrl, userId, course.id, createEnrollmentWithAddons]);

  const handleSubmit = useCallback(async () => {
    // If using Formbricks and survey not completed, don't allow submit
    if (useFormbricks && !formbricksSurveyCompleted && currentStep === 'questionnaire') {
      setError(t('errors.complete_survey_first'));
      return;
    }
    
    if (!useFormbricks && config.requiresInput && !motivationLetter.trim()) {
      setError(t('errors.motivation_letter_required'));
      return;
    }

    if (config.requiresPayment && !acceptTerms) {
      setError(t('errors.terms_required'));
      return;
    }

    // Validate that there's something to charge for payment flows
    if (config.requiresPayment) {
      const hasBasePrice = basePrice > 0;
      const hasAddons = selectedAddons.length > 0 && selectedAddons.some(addon => addon.validatedPrice > 0);
      
      if (!hasBasePrice && !hasAddons) {
        setError(t('errors.no_items_to_charge'));
        return;
      }

      // Validate currency consistency
      if (currencyMismatch) {
        setError(t('errors.currency_mismatch') || 'All add-ons must use the same currency as the course');
        return;
      }
    }

    setError(null);

    const result = await onSubmit({
      motivationLetter: motivationLetter.trim(),
      acceptTerms,
      enrollmentId: config.requiresPayment ? enrollmentId : undefined,
    });

    if (result.success) {
      // Close modal immediately after successful submission
      closeModal();
    } else {
      setError(result.error || t('errors.registration_failed'));
    }
  }, [config, motivationLetter, acceptTerms, onSubmit, t, closeModal, useFormbricks, formbricksSurveyCompleted, currentStep, basePrice, enrollmentId, selectedAddons, currencyMismatch]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      closeModal();
      // Reset form state when modal closes
      setError(null);
      setMotivationLetter('');
      setAcceptTerms(false);
      setFormbricksSurveyCompleted(false);
      setSelectedAddons([]);
      setEnrollmentId(null);
      setIsFetchingAddons(false);
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

  const isSubmitDisabled = useMemo(() => {
    if (isLoading) return true;
    if (isFetchingAddons) return true;
    
    if (config.requiresPayment && currentStep === 'summary') {
      return !acceptTerms || currencyMismatch;
    }
    
    if (useFormbricks) {
      return !formbricksSurveyCompleted;
    }
    
    if (config.requiresInput) {
      return !motivationLetter.trim();
    }
    
    return false;
  }, [isLoading, isFetchingAddons, config, currentStep, acceptTerms, currencyMismatch, useFormbricks, formbricksSurveyCompleted, motivationLetter]);

  const renderQuestionnaireStep = () => (
    <>
      {/* Formbricks Survey Embed */}
      {useFormbricks && userId && effectiveSurveyUrl && (
        <div className="flex-1 mb-4 overflow-hidden" style={{ minHeight: '700px', height: '100%' }}>
          <FormbricksSurveyEmbed
            surveyUrl={prefilledSurveyUrl || effectiveSurveyUrl}
            userId={userId}
            courseId={course.id}
            onComplete={handleFormbricksComplete}
            onError={setError}
            className="h-full w-full"
          />
          {formbricksSurveyCompleted && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{t('formbricks.survey_completed')}</p>
            </div>
          )}
        </div>
      )}

      {/* Traditional Motivation Letter Input */}
      {!useFormbricks && config.requiresInput && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-label-primary mb-2">{t('modal.motivation_letter_label')}</label>
          <textarea
            value={motivationLetter}
            onChange={(e) => setMotivationLetter(e.target.value)}
            className="w-full p-3 border border-border-primary rounded-md focus:ring-2 focus:ring-brand focus:border-transparent text-sm sm:text-base text-label-primary bg-fill-primary"
            rows={7}
            placeholder={t('modal.motivation_letter_placeholder')}
            disabled={isLoading}
          />
        </div>
      )}
    </>
  );

  const renderSummaryStep = () => {
    // Show loading spinner while fetching addons
    if (isFetchingAddons) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
          <p className="text-sm text-label-secondary">{t('formbricks.loading_addons')}</p>
        </div>
      );
    }

    return (
      <>
        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-label-primary leading-relaxed">
            {t('modal.summary_description', { title: course.title })}
          </p>
        </div>

        {/* Pricing Summary */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              {/* Base Price - only show if > 0 */}
              {basePrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-800">{t('modal.base_price')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(basePrice, currency)}
                  </span>
                </div>
              )}

              {/* Add-ons - each with individual price */}
              {selectedAddons.length > 0 && selectedAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-800">{addon.description}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(addon.validatedPrice, addon.currency || currency)}
                  </span>
                </div>
              ))}

              {/* Total - hide or show warning when currency mismatch */}
              {currencyMismatch ? (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-amber-700">
                    {t('errors.currency_mismatch') || 'Prices in multiple currencies cannot be totaled'}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">{t('modal.total')}</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatPrice(totalPrice, currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
              disabled={isLoading}
            />
            <span className="text-sm text-label-primary leading-relaxed">
              {t.rich('modal.accept_terms', {
                terms: (chunks) => (
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
        </div>
      </>
    );
  };

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      maxWidth={useFormbricks && currentStep === 'questionnaire' ? 'lg' : 'md'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          minHeight: useFormbricks && currentStep === 'questionnaire' ? '85vh' : '480px',
          maxHeight: '95vh',
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
      <DialogTitle sx={{ padding: { xs: '16px', sm: '24px' } }} className="light">
        <div className="flex justify-between items-center">
          <span className="text-lg sm:text-xl font-semibold pr-4 text-label-primary">{getModalTitle()}</span>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 text-label-primary"
            aria-label={t('modal.close')}
            disabled={isLoading}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent sx={{ padding: { xs: '0 16px', sm: '0 24px' }, flex: 1, display: 'flex', flexDirection: 'column' }} className="light">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {currentStep === 'questionnaire' && renderQuestionnaireStep()}
        {currentStep === 'summary' && renderSummaryStep()}
      </DialogContent>

      {/* Submit button - show for summary step or non-payment flows */}
      {(currentStep === 'summary' || (!config.requiresPayment && (!useFormbricks || formbricksSurveyCompleted))) && (
        <DialogActions sx={{ padding: { xs: '16px', sm: '24px' }, paddingTop: 0 }} className="light">
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-label-primary"></div>
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
      )}
    </Dialog>
  );
};
