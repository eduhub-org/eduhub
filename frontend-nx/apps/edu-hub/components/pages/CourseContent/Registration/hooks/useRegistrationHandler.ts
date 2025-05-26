import { useCallback, useState } from 'react';
import { signIn } from 'next-auth/react';

import { CourseRegistrationType_enum, CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../../queries/__generated__/CourseWithEnrollment';
import { useAuthedMutation } from '../../../../../hooks/authedMutation';
import { useUserId } from '../../../../../hooks/user';
import { UPDATE_ENROLLMENT } from '../../../../../queries/insertEnrollment';
import { UpdateEnrollment, UpdateEnrollmentVariables } from '../../../../../queries/__generated__/UpdateEnrollment';
import { getRegistrationTypeConfig, RegistrationFormData, RegistrationResult } from '../types';

/**
 * Props for the useRegistrationHandler hook
 */
interface UseRegistrationHandlerProps {
  /** Course data containing registration configuration and details */
  course: Course_Course_by_pk;
  /** Optional existing enrollment data for the current user */
  courseEnrollment?: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
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
  courseEnrollment,
  onSuccess,
}: UseRegistrationHandlerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useUserId();
  
  const [insertEnrollmentMutation] = useAuthedMutation<UpdateEnrollment, UpdateEnrollmentVariables>(
    UPDATE_ENROLLMENT
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
        const status = config.isDirect 
          ? CourseEnrollmentStatus_enum.CONFIRMED 
          : CourseEnrollmentStatus_enum.APPLIED;

        const result = await insertEnrollmentMutation({
          variables: {
            courseId: course.id,
            userId,
            motivationLetter: formData?.motivationLetter || '',
            status,
          },
        });

        if (result.data?.insert_CourseEnrollment?.affected_rows && result.data.insert_CourseEnrollment.affected_rows > 0) {
          onSuccess?.();
          return {
            success: true,
            enrollmentId: undefined, // UPDATE_ENROLLMENT doesn't return the enrollment ID
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
    [course.id, insertEnrollmentMutation, userId, onSuccess, config.isDirect]
  );

  const handlePaymentRegistration = useCallback(
    async (formData: RegistrationFormData): Promise<RegistrationResult> => {
      // TODO: Implement payment logic
      // This would integrate with a payment provider
      console.log('Payment registration not yet implemented', formData);
      return { success: false, error: 'Payment registration not yet implemented' };
    },
    []
  );

  const handleRegistration = useCallback(() => {
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
  }, [config, handleExternalRegistration, handleDirectRegistration]);

  const submitRegistration = useCallback(
    async (formData: RegistrationFormData): Promise<RegistrationResult> => {
      if (config.requiresPayment) {
        return handlePaymentRegistration(formData);
      }

      return handleDirectRegistration(formData);
    },
    [config.requiresPayment, handlePaymentRegistration, handleDirectRegistration]
  );

  return {
    isModalOpen,
    setIsModalOpen,
    isLoading,
    registrationType,
    config,
    handleLogin,
    handleRegistration,
    submitRegistration,
  };
}; 