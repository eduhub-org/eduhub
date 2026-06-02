import { FC, ReactNode, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
import { ProgramType } from '../../../types/enums';
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
import { ONBOARDING_TEXT_BY_TYPE } from '../../../queries/onboardingText';
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

type OnboardingTextByType = {
  OnboardingText: Array<{
    id: number;
    programType: string;
    lang: string;
    text: string;
  }>;
};

const renderPrivacyLink = (chunks: ReactNode) => (
  <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
    {chunks}
  </Link>
);

const Onboarding: FC<OnboardingProps> = ({ course, enrollmentId, refetchCourse, setResetValues }) => {
  const tCourse = useTranslations('course');
  const tProfile = useTranslations('profile');
  const locale = useLocale();
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

  const rawProgramType = (course?.Program as { type?: string } | null | undefined)?.type;
  let programTypeForText: ProgramType = ProgramType.COURSES;
  if (rawProgramType === ProgramType.EVENTS) {
    programTypeForText = ProgramType.EVENTS;
  } else if (rawProgramType === ProgramType.DEGREES) {
    programTypeForText = ProgramType.DEGREES;
  }

  const { data: onboardingTextData } = useRoleQuery<OnboardingTextByType>(ONBOARDING_TEXT_BY_TYPE, {
    variables: {
      programType: programTypeForText,
    },
    skip: sessionStatus === 'loading',
  });

  const languageForText = locale.toUpperCase() === 'DE' ? 'DE' : 'EN';
  const onboardingText =
    onboardingTextData?.OnboardingText.find((entry) => entry.lang === languageForText)?.text ??
    onboardingTextData?.OnboardingText.find((entry) => entry.lang === 'EN')?.text ??
    '';

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
  const occupationOptions = (queryOccupationOptions.data?.UserOccupation || []).map((x: { value: string }) => ({
    label: tProfile(`occupation.${x.value}`),
    value: x.value,
  }));

  // Organization ids and their corresponding names
  const organizationOptions =
    organizationData?.Organization?.map((org: { name: string; id: number; aliases: string[] | null }) => ({
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
        <ReactMarkdown
          className="prose max-w-none text-label-primary prose-headings:font-bold prose-headings:text-label-primary prose-p:text-label-secondary prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
          remarkPlugins={[remarkGfm]}
        >
          {onboardingText}
        </ReactMarkdown>
      </div>

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
            type="input"
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

      {submissionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submissionError}</div>
      )}

      <div className="flex flex-col lg:flex-row lg:gap-5">
        <Button
          as="button"
          type="button"
          disabled={isSubmitting}
          className="mt-8 block mx-auto lg:mb-5 bg-error text-fill-primary border-error hover:bg-error hover:border-error hover:opacity-90 disabled:bg-fill-disabled disabled:text-label-disabled"
          onClick={() => setShowDeclineDialog(true)}
        >
          {isSubmitting ? <CircularProgress /> : tCourse('general.reject')}
        </Button>
        <Button
          as="button"
          type="button"
          disabled={isSubmitting}
          className="mt-4 lg:mt-8 block mx-auto lg:mb-5 bg-success text-fill-primary border-success hover:bg-success hover:border-success hover:opacity-90 disabled:bg-fill-disabled disabled:text-label-disabled"
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
