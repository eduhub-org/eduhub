import { useCallback, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useApolloClient } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { CourseRegistrationType_enum, CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../../queries/__generated__/Course';
import { useAuthedMutation } from '../../../../../hooks/authedMutation';
import { useCurrentRole } from '../../../../../hooks/authentication';
import { useUserId } from '../../../../../hooks/user';
import { AuthRoles } from '../../../../../types/enums';
import {
  UPDATE_ENROLLMENT,
  UPDATE_ENROLLMENT_TERMS_ACCEPTED,
  GET_ENROLLMENT_TERMS_ACCEPTED_AT,
} from '../../../../../queries/insertEnrollment';
import { UpdateEnrollment, UpdateEnrollmentVariables } from '../../../../../queries/__generated__/UpdateEnrollment';
import {
  UpdateEnrollmentTermsAccepted,
  UpdateEnrollmentTermsAcceptedVariables,
} from '../../../../../queries/__generated__/UpdateEnrollmentTermsAccepted';
import {
  GetEnrollmentTermsAcceptedAt,
  GetEnrollmentTermsAcceptedAtVariables,
} from '../../../../../queries/__generated__/GetEnrollmentTermsAcceptedAt';
import { CREATE_STRIPE_CHECKOUT } from '../../../../../queries/stripe';
import { CreateStripeCheckout, CreateStripeCheckoutVariables } from '../../../../../queries/__generated__/CreateStripeCheckout';
import { getRegistrationTypeConfig, RegistrationFormData, RegistrationResult } from '../types';

/**
 * Props for the useRegistrationHandler hook
 */
interface UseRegistrationHandlerProps {
  /** Course data containing registration configuration and details */
  course: Course_Course_by_pk;
  /** Whether active participants reached the course capacity */
  isCourseFull: boolean;
  /** Optional callback after successful enrollment creation; `waitlist` when the course was full */
  onSuccess?: (info?: { waitlist: boolean }) => void;
}

/**
 * Custom hook that encapsulates all registration logic and state management.
 * Handles different registration types, modal state, form submissions, and integrates
 * with GraphQL mutations for course enrollment.
 * 
 * Features:
 * - Automatic registration type detection and configuration
 * - Modal state management for input forms
 * - Loading state management during async operations
 * - Authentication handling (login redirect for unauthenticated users)
 * - External registration link handling
 * - Direct registration without approval
 * - Approval-based registration with motivation letters
 * - Payment integration preparation (not yet implemented)
 * - Comprehensive error handling with detailed error messages
 * - Success callbacks for UI updates
 * 
 * Registration flow handling:
 * 1. External: Opens external registration link in new tab
 * 2. Direct without input: Immediately creates confirmed enrollment
 * 3. Direct with input: Opens modal, then creates confirmed enrollment
 * 4. Approval with input: Opens modal, then creates applied enrollment
 * 5. Payment: Opens modal with payment terms (implementation pending)
 * 
 * @param props - The hook configuration
 * @returns Object containing registration handlers, state, and configuration
 */
export const useRegistrationHandler = ({
  course,
  isCourseFull,
  onSuccess,
}: UseRegistrationHandlerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryEnrollmentId, setRetryEnrollmentId] = useState<number | null>(null);
  const userId = useUserId();
  const t = useTranslations('course');
  const apolloClient = useApolloClient();
  const { data: sessionData } = useSession();
  const currentRole = useCurrentRole();

  const [updateEnrollmentMutation] = useAuthedMutation<UpdateEnrollment, UpdateEnrollmentVariables>(
    UPDATE_ENROLLMENT
  );

  const [createStripeCheckoutMutation] = useAuthedMutation<CreateStripeCheckout, CreateStripeCheckoutVariables>(
    CREATE_STRIPE_CHECKOUT
  );

  const [updateEnrollmentTermsAcceptedMutation] = useAuthedMutation<
    UpdateEnrollmentTermsAccepted,
    UpdateEnrollmentTermsAcceptedVariables
  >(UPDATE_ENROLLMENT_TERMS_ACCEPTED);

  /**
   * Persists the user's acceptance of the Terms & Conditions / Privacy
   * Policy against an existing enrollment and confirms it landed in the
   * database before the caller proceeds to checkout.
   *
   * Because UPDATE_ENROLLMENT_TERMS_ACCEPTED only writes when the column
   * is currently NULL, `affected_rows: 0` is the *expected* response on
   * a legitimate retry where consent is already on record. We therefore
   * disambiguate the zero-rows case with an authoritative network read
   * and treat a still-null value as a hard failure.
   *
   * @returns true when the database holds a non-null termsAcceptedAt for
   *          this enrollment, false otherwise (callers must abort).
   */
  const recordTermsAcceptance = useCallback(
    async (enrollmentId: number, termsAcceptedAt: string): Promise<boolean> => {
      try {
        const updateResult = await updateEnrollmentTermsAcceptedMutation({
          variables: { enrollmentId, termsAcceptedAt },
        });

        const affectedRows =
          updateResult.data?.update_CourseEnrollment?.affected_rows ?? 0;

        if (affectedRows > 0) {
          return true;
        }

        const accessToken = sessionData?.accessToken;
        const role =
          currentRole === AuthRoles.anonymous ? AuthRoles.user : currentRole;
        const verifyResult = await apolloClient.query<
          GetEnrollmentTermsAcceptedAt,
          GetEnrollmentTermsAcceptedAtVariables
        >({
          query: GET_ENROLLMENT_TERMS_ACCEPTED_AT,
          variables: { enrollmentId },
          fetchPolicy: 'network-only',
          context: accessToken
            ? {
                headers: {
                  'x-hasura-role': role,
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            : undefined,
        });

        const recordedAt =
          verifyResult.data?.CourseEnrollment_by_pk?.termsAcceptedAt ?? null;

        if (!recordedAt) {
          console.error(
            'Terms acceptance verification failed: enrollment has no termsAcceptedAt on record',
            { enrollmentId }
          );
          return false;
        }

        return true;
      } catch (termsError) {
        console.error('Failed to record terms acceptance:', termsError);
        return false;
      }
    },
    [
      updateEnrollmentTermsAcceptedMutation,
      apolloClient,
      sessionData?.accessToken,
      currentRole,
    ]
  );

  const registrationType = course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT;
  const config = getRegistrationTypeConfig(registrationType);

  const handleLogin = useCallback(() => {
    return signIn('keycloak');
  }, []);

  const handleExternalRegistration = useCallback(() => {
    if (course.externalRegistrationLink) {
      window.open(course.externalRegistrationLink, '_blank');
    }
  }, [course.externalRegistrationLink]);

  const handleDirectRegistration = useCallback(
    async (formData?: RegistrationFormData): Promise<RegistrationResult> => {
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      setIsLoading(true);
      try {
        // Determine the correct status based on registration type
        let status: CourseEnrollmentStatus_enum;
        if (isCourseFull) {
          status = CourseEnrollmentStatus_enum.WAITLIST;
        } else if (config.isDirect) {
          status = CourseEnrollmentStatus_enum.CONFIRMED;
        } else {
          status = CourseEnrollmentStatus_enum.APPLIED;
        }

        const result = await updateEnrollmentMutation({
          variables: {
            courseId: course.id,
            userId,
            motivationLetter: formData?.motivationLetter || '',
            status,
            termsAcceptedAt: formData?.acceptTerms ? new Date().toISOString() : null,
          },
        });

        if (result.data?.insert_CourseEnrollment?.affected_rows && result.data.insert_CourseEnrollment.affected_rows > 0) {
          onSuccess?.({ waitlist: status === CourseEnrollmentStatus_enum.WAITLIST });
          return {
            success: true,
            enrollmentId: result.data.insert_CourseEnrollment.returning?.[0]?.id,
          };
        }

        return { success: false, error: 'Failed to create enrollment' };
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Registration failed' };
      } finally {
        setIsLoading(false);
      }
    },
    [course.id, updateEnrollmentMutation, userId, onSuccess, config.isDirect, isCourseFull]
  );

  const handlePaymentRegistration = useCallback(
    async (formData: RegistrationFormData): Promise<RegistrationResult> => {
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (!course?.id) {
        return { success: false, error: 'Course information is required' };
      }

      // Enrollment should already be created with addons via createEnrollmentWithAddons action
      const enrollmentId = formData?.enrollmentId;
      if (!enrollmentId) {
        return { success: false, error: 'Enrollment ID is required. Enrollment should be created before payment.' };
      }

      // Terms & Conditions / Privacy Policy must be accepted before we
      // initiate the paid checkout. We require this at the application
      // boundary so the legal record is captured even if Stripe redirect
      // fails afterwards.
      if (!formData?.acceptTerms) {
        return { success: false, error: 'Terms & Conditions must be accepted before payment.' };
      }

      setIsLoading(true);
      try {
        // Persist terms acceptance with a server-verified timestamp BEFORE
        // creating the Stripe Checkout session. recordTermsAcceptance handles
        // the idempotency / verification semantics; we only need to abort
        // with a localized error if it returns false.
        const termsAcceptedAt = new Date().toISOString();
        const consentRecorded = await recordTermsAcceptance(enrollmentId, termsAcceptedAt);
        if (!consentRecorded) {
          return { success: false, error: t('errors.terms_record_failed') };
        }

        // Create Stripe Checkout session
        // Server will read addons from CourseEnrollmentAddon table using enrollmentId
        // URLs are built server-side from FRONTEND_URL for security
        const checkoutResult = await createStripeCheckoutMutation({
          variables: {
            courseId: course.id,
            enrollmentId,
            formbricksResponseId: null, // Will be fetched server-side if needed
            userEmail: null, // Will be fetched from user context server-side
            course: null, // Will be fetched server-side from Hasura
            addonMappings: null, // Will be fetched server-side from Hasura
          },
        });

        if (checkoutResult.data?.createStripeCheckout?.success && checkoutResult.data.createStripeCheckout.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = checkoutResult.data.createStripeCheckout.checkoutUrl;
          
          return {
            success: true,
            paymentUrl: checkoutResult.data.createStripeCheckout.checkoutUrl,
            enrollmentId,
          };
        }

        return {
          success: false,
          error: checkoutResult.data?.createStripeCheckout?.error || 'Failed to create checkout session',
        };
      } catch (error) {
        console.error('Payment registration error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Payment registration failed',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [
      course?.id,
      userId,
      createStripeCheckoutMutation,
      recordTermsAcceptance,
      t,
    ]
  );

  const handleRegistration = useCallback(() => {
    // Check if user is authenticated before proceeding with any registration logic
    if (!userId) {
      handleLogin();
      return;
    }

    if (isCourseFull) {
      // Waitlist: only open the modal when there is an application form (survey or motivation letter).
      // Payment UI and createEnrollmentWithAddons must not run for full courses; submit goes to WAITLIST.
      if (config.requiresInput) {
        setIsModalOpen(true);
        return;
      }
      handleDirectRegistration();
      return;
    }

    if (config.isExternal) {
      handleExternalRegistration();
      return;
    }

    if (config.requiresInput || config.requiresPayment) {
      // Open modal for input
      setIsModalOpen(true);
      return;
    }

    // Direct registration without input
    if (config.isDirect) {
      handleDirectRegistration();
    }
  }, [userId, handleLogin, config, handleExternalRegistration, handleDirectRegistration, isCourseFull]);

  const submitRegistration = useCallback(
    async (formData: RegistrationFormData): Promise<RegistrationResult> => {
      if (isCourseFull) {
        return handleDirectRegistration(formData);
      }

      if (config.requiresPayment) {
        return handlePaymentRegistration(formData);
      }

      return handleDirectRegistration(formData);
    },
    [config.requiresPayment, handlePaymentRegistration, handleDirectRegistration, isCourseFull]
  );

  const retryPayment = useCallback(
    (enrollmentId: number): void => {
      // Store enrollment ID for retry - RegistrationModal will fetch responses and build prefilled URL
      setRetryEnrollmentId(enrollmentId);
      setIsModalOpen(true);
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setRetryEnrollmentId(null); // Clear retry enrollment ID when modal closes
  }, []);

  return {
    isModalOpen,
    closeModal: handleCloseModal,
    isLoading,
    registrationType,
    config,
    handleLogin,
    handleRegistration,
    handleExternalRegistration,
    submitRegistration,
    retryPayment,
    retryEnrollmentId,
  };
}; 