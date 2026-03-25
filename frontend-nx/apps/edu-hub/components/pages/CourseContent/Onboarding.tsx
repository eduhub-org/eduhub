import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import Link from 'next/link';

import { useRoleMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import {
  UPDATE_USER_OCCUPATION,
  UPDATE_USER_ORGANIZATION_ID,
  UPDATE_USER_MATRICULATION_NUMBER,
} from '../../../queries/updateUser';
import { UPDATE_ENROLLMENT_STATUS } from '../../../queries/insertEnrollment';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import { USER, USER_OCCUPATION } from '../../../queries/user';
import {
  CREATE_ORGANIZATION,
  ORGANIZATION_OPTIONS,
} from '../../../queries/organization';
import {
  OrganizationOptions as OrganizationOptionsQuery,
  OrganizationOptionsVariables,
} from '../../../queries/__generated__/OrganizationOptions';
import {
  ORGANIZATION_NEWSLETTER_SUBSCRIPTION_BY_PK,
  UPSERT_ORGANIZATION_NEWSLETTER_SUBSCRIPTION,
} from '../../../queries/newsletterSubscription';
import { UserOccupation } from '../../../queries/__generated__/UserOccupation';
import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';

import type { OperationVariables, ApolloQueryResult } from '@apollo/client';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import {
  CourseWithEnrollment,
  CourseWithEnrollment_Course_by_pk,
} from '../../../queries/__generated__/CourseWithEnrollment';
import {
  UpdateEnrollmentStatus,
  UpdateEnrollmentStatusVariables,
} from '../../../queries/__generated__/UpdateEnrollmentStatus';
import { User } from '../../../queries/__generated__/User';
import { useSession } from 'next-auth/react';

interface OnboardingProps {
  course: CourseWithEnrollment_Course_by_pk | Course_Course_by_pk;
  enrollmentId: number;
  refetchCourse: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<CourseWithEnrollment>>;
  setResetValues: (value: boolean) => void;
}

interface OrganizationWithNewsletter {
  id: number;
  name: string;
  ghostNewsletterListId?: string | null;
  ghostNewsletterSlug?: string | null;
  ghostNewsletterLabel?: string | null;
  ghostNewsletterDoubleOptInEnabled?: boolean | null;
  newsletterDescription?: string | null;
}

const renderPrivacyLink = (chunks: ReactNode) => (
  <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
    {chunks}
  </Link>
);

const Onboarding: FC<OnboardingProps> = ({ course, enrollmentId, refetchCourse, setResetValues }) => {
  const tCourse = useTranslations('course');
  const tProfile = useTranslations('profile');
  const userId = useUserId();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrganizationOptionsError, setShowOrganizationOptionsError] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { status: sessionStatus } = useSession();

  const { data: userData } = useRoleQuery<User>(USER, {
    variables: { userId },
  });

  const queryOccupationOptions = useRoleQuery<UserOccupation>(USER_OCCUPATION, {
    skip: sessionStatus === 'loading',
  });
  const { data: organizationData, error: organizationOptionsError, loading: organizationOptionsLoading } = useRoleQuery<
    OrganizationOptionsQuery,
    OrganizationOptionsVariables
  >(ORGANIZATION_OPTIONS, {
    variables: {
      limit: 50000,
    },
    skip: sessionStatus === 'loading',
  });

  const [updateEnrollmentStatus] = useRoleMutation<UpdateEnrollmentStatus, UpdateEnrollmentStatusVariables>(
    UPDATE_ENROLLMENT_STATUS
  );

  const organizationWithNewsletter = (course?.Program as
    | {
        Organization?: OrganizationWithNewsletter | null;
      }
    | null
    | undefined)?.Organization;
  const organizationId = organizationWithNewsletter?.id;
  const hasOrganizationId = organizationId !== null && organizationId !== undefined;
  const hasOrganizationNewsletter =
    !!organizationWithNewsletter &&
    (!!organizationWithNewsletter.ghostNewsletterListId || !!organizationWithNewsletter.ghostNewsletterSlug);
  const newsletterDescription = organizationWithNewsletter?.newsletterDescription?.trim() || '';

  const { data: newsletterSubscriptionData } = useRoleQuery(ORGANIZATION_NEWSLETTER_SUBSCRIPTION_BY_PK, {
    skip: !hasOrganizationNewsletter || !hasOrganizationId || !userId,
    variables: {
      userId,
      organizationId: organizationId ?? -1,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [upsertNewsletterSubscription] = useRoleMutation(UPSERT_ORGANIZATION_NEWSLETTER_SUBSCRIPTION);

  useEffect(() => {
    const currentStatus = newsletterSubscriptionData?.OrganizationNewsletterSubscription_by_pk?.status;
    if (currentStatus === 'SUBSCRIBED' || currentStatus === 'PENDING') {
      setNewsletterOptIn(true);
      return;
    }
    if (currentStatus === 'UNSUBSCRIBED' || currentStatus === 'ERROR') {
      setNewsletterOptIn(false);
    }
  }, [newsletterSubscriptionData?.OrganizationNewsletterSubscription_by_pk?.status]);

  // Occupation enums and their translated labels
  const occupationOptions = (queryOccupationOptions.data?.UserOccupation || []).map((x) => ({
    label: tProfile(`occupation.${x.value}`),
    value: x.value,
  }));

  // Organization ids and their corresponding names
  const organizationOptions =
    organizationData?.Organization?.map((org) => ({
      label: org.name,
      value: org.id.toString(),
      aliases: org.aliases,
    })) || [];

  const isOrganizationLookupUnavailable = organizationOptionsLoading || !!organizationOptionsError;

  useEffect(() => {
    if (organizationOptionsError) {
      console.error('Failed to load organization options query:', organizationOptionsError);
      setShowOrganizationOptionsError(true);
    }
  }, [organizationOptionsError]);

  // Render loading state
  if (sessionStatus === 'loading') {
    return <div>Loading...</div>;
  }

  const getOrganizationLabel = (occupation: string) => {
    switch (occupation) {
      case 'HIGH_SCHOOL_STUDENT':
        return tProfile('organization.label_school');
      case 'UNIVERSITY_STUDENT':
        return tProfile('organization.label_university');
      case 'EMPLOYED_FULL_TIME':
      case 'EMPLOYED_PART_TIME':
      case 'SELF_EMPLOYED':
        return tProfile('organization.label_company');
      case 'RESEARCHER':
        return tProfile('organization.label_research');
      case 'EDUCATOR':
        return tProfile('organization.label_education');
      default:
        return tProfile('organization.label_base');
    }
  };

  const handleEnrollmentCancellation = async () => {
    try {
      setIsSubmitting(true);
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CANCELLED,
        },
      });
      await refetchCourse();
      setShowDeclineDialog(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollmentConfirmation = async () => {
    try {
      setSubmissionError(null);
      setIsSubmitting(true);

      // Confirm enrollment first so newsletter preference changes are only applied after successful enrollment.
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CONFIRMED,
        },
      });

      if (hasOrganizationNewsletter && hasOrganizationId && userId) {
        try {
          await upsertNewsletterSubscription({
            variables: {
              userId,
              organizationId,
              status: newsletterOptIn ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
              source: 'CHECKBOX',
            },
          });
        } catch (newsletterError) {
          console.log('Newsletter preference update failed after enrollment confirmation', newsletterError);
        }
      }
      await refetchCourse();
      setResetValues(false);
    } catch (error) {
      console.log(error);
      setSubmissionError(tCourse('onboarding_modal.errors.confirmation_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) {
    return <div>{tCourse('general.course_not_available')}</div>;
  }

  return (
    <div className="bg-edu-course-invited rounded-2xl p-6 text-label-primary light mb-12 border border-border-primary/30 shadow-lg">
      <div className="mb-6 rounded-xl bg-fill-primary p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-warning mb-2">
          {tCourse('onboarding_modal.badge')}
        </div>
        <div className="text-2xl font-bold">{tCourse('onboarding_modal.important')}</div>
        <div className="mt-2 text-lg font-semibold">{tCourse('onboarding_modal.congratulation')}</div>
        <div className="mt-3 text-sm text-label-secondary">{tCourse('onboarding_modal.intro_copy')}</div>
      </div>

      <div className="pb-3 text-sm font-medium">{tCourse('onboarding_modal.form_intro')}</div>

      <div className="flex flex-wrap gap-y-1">
        <div className="w-full lg:w-1/2 lg:pr-3">
          <DropDownSelector
            variant="eduhub"
            label={tProfile('occupation.label')}
            value={userData?.User_by_pk?.occupation || ''}
            options={occupationOptions}
            updateValueMutation={UPDATE_USER_OCCUPATION}
            identifierVariables={{ userId }}
            className="text-black mb-2"
          />
        </div>
        <div className="w-full lg:w-1/2 lg:pl-3">
          <DropDownSelector
            variant="eduhub"
            creatable={!isOrganizationLookupUnavailable}
            label={getOrganizationLabel(userData?.User_by_pk?.occupation ?? '')}
            value={userData?.User_by_pk?.Organization?.id?.toString() || ''}
            placeholder={tProfile('organization.placeholder')}
            options={organizationOptions}
            updateValueMutation={UPDATE_USER_ORGANIZATION_ID}
            identifierVariables={{ userId }}
            createOptionMutation={CREATE_ORGANIZATION}
            className="text-black mb-2"
            disabled={isOrganizationLookupUnavailable}
          />
        </div>
      </div>

      {userData?.User_by_pk?.occupation === 'UNIVERSITY_STUDENT' && (
        <div className="w-full lg:w-1/2 lg:pr-3">
          <InputField
            variant="eduhub"
            type="number"
            label={tProfile('matriculation_number')}
            itemId={userData?.User_by_pk?.id}
            value={userData?.User_by_pk?.matriculationNumber || ''}
            updateValueMutation={UPDATE_USER_MATRICULATION_NUMBER}
            showCharacterCount={false}
            className="text-black"
          />
        </div>
      )}

      {hasOrganizationNewsletter && hasOrganizationId && (
        <div className="mt-5 rounded-xl border border-border-primary/40 bg-fill-primary p-4">
          <div className="flex items-start gap-3">
            <input
              id="newsletter-onboarding-optin"
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(event) => setNewsletterOptIn(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              disabled={isSubmitting}
            />
            <div>
              <label htmlFor="newsletter-onboarding-optin" className="text-sm font-semibold cursor-pointer">
                {tCourse('onboarding_modal.newsletter_title', {
                  organization: organizationWithNewsletter.ghostNewsletterLabel || organizationWithNewsletter.name,
                })}
              </label>
              <p className="mt-1 text-sm text-label-secondary">
                {tCourse('onboarding_modal.newsletter_description', {
                  organization: organizationWithNewsletter.name,
                })}
              </p>
              {newsletterDescription && (
                <p className="mt-1 text-sm text-label-secondary">{newsletterDescription}</p>
              )}
              <p className="mt-2 text-xs text-label-secondary">
                {tCourse.rich('onboarding_modal.newsletter_legal', {
                  privacy: renderPrivacyLink,
                })}
              </p>
              {organizationWithNewsletter.ghostNewsletterDoubleOptInEnabled && (
                <p className="mt-1 text-xs text-label-secondary">
                  {tCourse('onboarding_modal.newsletter_double_opt_in')}
                </p>
              )}
            </div>
          </div>
          {newsletterSubscriptionData?.OrganizationNewsletterSubscription_by_pk?.status === 'ERROR' && (
            <p className="mt-3 text-xs text-red-700">
              {tCourse('onboarding_modal.newsletter_sync_issue')}
            </p>
          )}
        </div>
      )}

      <div className="pt-5 pb-2 text-sm">{tCourse('onboarding_modal.confirm_sufficient_time')}</div>
      <div className="pb-2">
        <b>{tCourse('onboarding_modal.mattermost_info_1')}</b>
      </div>
      <div className="pb-1 text-sm">{tCourse('onboarding_modal.mattermost_info_2')}</div>

      {submissionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submissionError}</div>
      )}

      <div className="flex flex-col lg:flex-row lg:gap-5">
        <Button
          as="button"
          type="button"
          disabled={isSubmitting}
          filled
          inverted
          className="mt-8 block mx-auto lg:mb-5 disabled:bg-slate-500"
          onClick={() => setShowDeclineDialog(true)}
        >
          {isSubmitting ? <CircularProgress /> : tCourse('general.reject')}
        </Button>
        <Button
          as="button"
          type="button"
          disabled={isSubmitting}
          filled
          className="mt-4 lg:mt-8 block mx-auto lg:mb-5 disabled:bg-slate-500"
          onClick={handleEnrollmentConfirmation}
        >
          {isSubmitting ? <CircularProgress /> : tCourse('general.confirm')}
        </Button>
      </div>

      <QuestionConfirmationDialog
        open={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={handleEnrollmentCancellation}
        question={tCourse('onboarding_modal.decline_confirm_text')}
        confirmationText={tCourse('onboarding_modal.decline_button_text')}
      />
      <ErrorMessageDialog
        errorMessage={tCourse('errors.failed_to_load_organization_options')}
        open={!!organizationOptionsError && showOrganizationOptionsError}
        onClose={() => setShowOrganizationOptionsError(false)}
      />
    </div>
  );
};

export default Onboarding;
