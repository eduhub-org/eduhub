import { FC, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CircularProgress } from '@mui/material';

import { useAuthedMutation } from '../../../hooks/authedMutation';
import { useAuthedQuery, useRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import {
  UPDATE_USER_OCCUPATION,
  UPDATE_USER_ORGANIZATION_ID,
  UPDATE_USER_MATRICULATION_NUMBER,
} from '../../../queries/updateUser';
import { UPDATE_ENROLLMENT_STATUS } from '../../../queries/insertEnrollment';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import { USER_OCCUPATION } from '../../../queries/user';
import { CREATE_ORGANIZATION, ORGANIZATION_LIST } from '../../../queries/organization';
import { OrganizationList } from '../../../queries/__generated__/OrganizationList';
import { UserOccupation } from '../../../queries/__generated__/UserOccupation';
import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
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
import { USER } from '../../../queries/user';
import { User } from '../../../queries/__generated__/User';
import { useSession } from 'next-auth/react';

interface OnboardingProps {
  course: CourseWithEnrollment_Course_by_pk | Course_Course_by_pk;
  enrollmentId: number;
  refetchCourse: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<CourseWithEnrollment>>;
  setResetValues: (value: boolean) => void;
}

const Onboarding: FC<OnboardingProps> = ({ course, enrollmentId, refetchCourse, setResetValues }) => {
  const t = useTranslations('course');
  const userId = useUserId();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { status: sessionStatus } = useSession();

  const { data: userData } = useAuthedQuery<User>(USER, {
    variables: { userId },
  });

  const queryOccupationOptions = useRoleQuery<UserOccupation>(USER_OCCUPATION, {
    skip: sessionStatus === 'loading',
  });
  const { data: organizationData } = useRoleQuery<OrganizationList>(ORGANIZATION_LIST, {
    variables: {
      limit: 100, // Adjust as needed
    },
    skip: sessionStatus === 'loading',
  });

  const [updateEnrollmentStatus] = useAuthedMutation<UpdateEnrollmentStatus, UpdateEnrollmentStatusVariables>(
    UPDATE_ENROLLMENT_STATUS
  );

  // Occupation enums and their translated labels
  const occupationOptions = (queryOccupationOptions.data?.UserOccupation || []).map((x) => ({
    label: t(`profile:occupation.${x.value}`), // Apply translation here
    value: x.value,
  }));

  // Organization ids and their corresponding names
  const organizationOptions =
    organizationData?.Organization?.map((org) => ({
      label: org.name,
      value: org.id.toString(),
      aliases: org.aliases,
    })) || [];

  // Render loading state
  if (sessionStatus === 'loading') {
    return <div>Loading...</div>;
  }

  const getOrganizationLabel = (occupation) => {
    switch (occupation) {
      case 'HIGH_SCHOOL_STUDENT':
        return t('profile:organization.label_school');
      case 'UNIVERSITY_STUDENT':
        return t('profile:organization.label_university');
      case 'EMPLOYED_FULL_TIME':
      case 'EMPLOYED_PART_TIME':
      case 'SELF_EMPLOYED':
        return t('profile:organization.label_company');
      case 'RESEARCHER':
        return t('profile:organization.label_research');
      case 'EDUCATOR':
        return t('profile:organization.label_education');
      default:
        return t('profile:organization.label_base');
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
      setIsSubmitting(true);
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CONFIRMED,
        },
      });
      await refetchCourse();
      setResetValues(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) {
    return <div>{t('general.course_not_available')}</div>;
  }

  return (
    <div className="bg-edu-course-invited rounded-2xl p-6 !text-edu-black mb-12">
      <div className="pb-5 text-2xl font-bold">{t('onboarding_modal.important')}</div>
      <div className="pb-5 text-xl font-bold">{t('onboarding_modal.congratulation')}</div>
      <div className="pb-4">{t('onboarding_modal.form_intro')}</div>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:pr-3">
          <DropDownSelector
            variant="eduhub"
            label={t('profile:occupation.label')}
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
            creatable={true}
            label={getOrganizationLabel(userData?.User_by_pk?.occupation)}
            value={userData?.User_by_pk?.Organization?.id?.toString() || ''}
            placeholder={t('profile:organization.placeholder')}
            options={organizationOptions}
            updateValueMutation={UPDATE_USER_ORGANIZATION_ID}
            identifierVariables={{ userId }}
            createOptionMutation={CREATE_ORGANIZATION}
            className="text-black mb-2"
          />
        </div>
      </div>
      {userData?.User_by_pk?.occupation === 'UNIVERSITY_STUDENT' && (
        <div className="w-full lg:w-1/2  lg:pr-3">
          <InputField
            variant="eduhub"
            type="number"
            label={t('profile:matriculation_number')}
            itemId={userData?.User_by_pk?.id}
            value={userData?.User_by_pk?.matriculationNumber || ''}
            updateValueMutation={UPDATE_USER_MATRICULATION_NUMBER}
            showCharacterCount={false}
            className="text-black"
          />
        </div>
      )}
      <div className="pb-3">{t('onboarding_modal.confirm_sufficient_time')}</div>
      <div className="pb-3">
        <b>{t('onboarding_modal.mattermost_info_1')}</b>
      </div>
      <div className="pb-0">{t('onboarding_modal.mattermost_info_2')}</div>
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
          {isSubmitting ? <CircularProgress /> : t('general.reject')}
        </Button>
        <Button
          as="button"
          type="button"
          disabled={isSubmitting}
          filled
          className="mt-4 lg:mt-8 block mx-auto lg:mb-5 disabled:bg-slate-500"
          onClick={handleEnrollmentConfirmation}
        >
          {isSubmitting ? <CircularProgress /> : t('general.confirm')}
        </Button>
      </div>

      <QuestionConfirmationDialog
        open={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={handleEnrollmentCancellation}
        question={t('onboarding_modal.decline_confirm_text')}
        confirmationText={t('onboarding_modal.decline_button_text')}
      />
    </div>
  );
};

export default Onboarding;
