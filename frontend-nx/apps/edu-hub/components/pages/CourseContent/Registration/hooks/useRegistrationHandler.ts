import { useCallback, useState } from 'react';
import { signIn } from 'next-auth/react';

import { CourseRegistrationType_enum, CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../../queries/__generated__/Course';
import { useAuthedMutation } from '../../../../../hooks/authedMutation';
import { useUserId } from '../../../../../hooks/user';
import { UPDATE_ENROLLMENT } from '../../../../../queries/insertEnrollment';
import { UpdateEnrollment, UpdateEnrollmentVariables } from '../../../../../queries/__generated__/UpdateEnrollment';
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
  /** Optional callback function called after successful registration */
  onSuccess?: () => void;
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
  
  const [updateEnrollmentMutation] = useAuthedMutation<UpdateEnrollment, UpdateEnrollmentVariables>(
    UPDATE_ENROLLMENT
  );

  const [createStripeCheckoutMutation] = useAuthedMutation<CreateStripeCheckout, CreateStripeCheckoutVariables>(
    CREATE_STRIPE_CHECKOUT
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
          onSuccess?.();
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

      setIsLoading(true);
      try {
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
    [course?.id, userId, createStripeCheckoutMutation]
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