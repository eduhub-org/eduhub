import { FC, useEffect, Dispatch, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@mui/material';

import { useAuthedMutation } from '../../../hooks/authedMutation';
import { useAuthedQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import { UPDATE_USER_ON_ENROLLMENT_CONFIRMATION } from '../../../graphql/mutations/updateUser';
import { USER } from '../../../graphql/queries/user/user';
import { UPDATE_ENROLLMENT_STATUS } from '../../../graphql/mutations/insertEnrollment';
import {
  CourseWithEnrollment,
  CourseWithEnrollment_Course_by_pk,
} from '../../../graphql/__generated__/CourseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import { University_enum } from '../../../__generated__/globalTypes';
import { Employment_enum } from '../../../__generated__/globalTypes';
import {
  UpdateUserOnEnrollmentConfirmationVariables,
  UpdateUserOnEnrollmentConfirmation,
} from '../../../graphql/__generated__/UpdateUserOnEnrollmentConfirmation';
import {
  UpdateEnrollmentStatus,
  UpdateEnrollmentStatusVariables,
} from '../../../graphql/__generated__/UpdateEnrollmentStatus';
import { User, UserVariables } from '../../../graphql/__generated__/User';
import { Button } from '../../common/Button';
import FormFieldRow from '../../forms/FormFieldRow';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';

import type { OperationVariables, ApolloQueryResult } from '@apollo/client';
import { Course_Course_by_pk } from '../../../graphql/__generated__/Course';

type Inputs = {
  employment: Employment_enum | null;
  otherUniversity?: string;
  university: University_enum | null;
  matriculationNumber: string;
};

interface OnboardingProps {
  course: CourseWithEnrollment_Course_by_pk | Course_Course_by_pk;
  enrollmentId: number;
  refetchCourse: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<CourseWithEnrollment>>;
  resetValues: { [key in keyof Inputs]?: string };
  setResetValues: Dispatch<any>;
}

const Onboarding: FC<OnboardingProps> = ({
  course,
  enrollmentId,
  refetchCourse,
  resetValues,
  setResetValues,
}) => {
  const { t } = useTranslation('course');
  const userId = useUserId();

  const methods = useForm<Inputs>({
    defaultValues: {
      employment: null,
      otherUniversity: null,
      university: null,
      matriculationNumber: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = methods;

  const [universityVisible, setUniversityVisible] = useState(false);
  const [otherUniversityVisible, setOtherUniversityVisible] = useState(false);
  const [otherUniversityLabel, setOtherUniversityLabel] = useState('');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const watchEmployment = watch('employment');
  const watchUniversity = watch('university');

  useEffect(() => {
    switch (watchEmployment) {
      case Employment_enum.STUDENT:
        setOtherUniversityLabel(t('common:otherUniversityLabel.university'));
        setUniversityVisible(true);

        if (watchUniversity === University_enum.OTHER) {
          setOtherUniversityVisible(true);
        } else {
          setOtherUniversityVisible(false);
        }
        break;

      case Employment_enum.OTHER:
        setOtherUniversityLabel(t('common:otherUniversityLabel.other'));
        setUniversityVisible(false);
        setOtherUniversityVisible(true);
        break;

      case Employment_enum.TEACHER:
        setOtherUniversityLabel(t('common:otherUniversityLabel.teacher'));
        setUniversityVisible(false);
        setOtherUniversityVisible(true);
        break;

      case Employment_enum.ACADEMIA:
      case Employment_enum.EMPLOYED:
        setOtherUniversityLabel(t('common:otherUniversityLabel.organization'));
        setUniversityVisible(false);
        setOtherUniversityVisible(true);
        break;

      default:
        setUniversityVisible(false);
        setOtherUniversityVisible(false);
        break;
    }
  }, [watchEmployment, watchUniversity, t]);

  const {
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useAuthedQuery<User, UserVariables>(USER, {
    variables: {
      userId,
    },
    skip: true,
  });

  useEffect(() => {
    if (resetValues) {
      const fetchUser = async () => {
        const userQueryResult = await refetchUser();
        const user = userQueryResult?.data?.User_by_pk;
        reset({
          employment: user?.employment,
          otherUniversity: user?.otherUniversity,
          university: user?.university,
          matriculationNumber: user?.matriculationNumber,
        });
      };
      fetchUser();
    }
  }, [refetchUser, resetValues, reset ]);

  const [updateUser] = useAuthedMutation<
    UpdateUserOnEnrollmentConfirmation,
    UpdateUserOnEnrollmentConfirmationVariables
  >(UPDATE_USER_ON_ENROLLMENT_CONFIRMATION);

  const [updateEnrollmentStatus] = useAuthedMutation<UpdateEnrollmentStatus, UpdateEnrollmentStatusVariables>(
    UPDATE_ENROLLMENT_STATUS
  );

  // const onCloseConfirmEnrollment = useCallback(() => {
  //   setModalOpen(false);
  // }, [setModalOpen]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateUser({
        variables: {
          userId,
          matriculationNumber: data.matriculationNumber,
          university: data.university,
          employment: data.employment,
          otherUniversity: data.otherUniversity,
        },
      });
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CONFIRMED,
        },
      });
      refetchCourse();
      setResetValues(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(error);
    }
  };

  const onEnrollmentCancellation = async () => {
    try {
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CANCELLED,
        },
      });
      refetchCourse();
      setResetValues(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(error);
    }
  };

  const onDeclineDialogClose = async (isDeclined) => {
    if (isDeclined) {
      await onEnrollmentCancellation();
      setShowDeclineDialog(false);
    } else {
      setShowDeclineDialog(false);
    }
  };

  const employmentSelectFormOptions = (Object.keys(Employment_enum) as Array<keyof typeof Employment_enum>).map(
    (key) => ({
      label: t(`common:${key}`),
      value: key,
    })
  );

  const universitySelectFormOptions = (Object.keys(University_enum) as Array<keyof typeof University_enum>).map(
    (key) => ({
      label: t(`common:${key}`),
      value: key,
    })
  );

  if (!course) {
    return <div>{t('courseNotAvailable')}</div>;
  }

  return (
    <div className="bg-edu-course-invited rounded-2xl p-6 !text-edu-black mb-12">
      {!userLoading && !userError && (
        <>
          <div className="pb-5 text-2xl font-bold">{t('onboardingModal.important')}</div>
          <div className="pb-5 text-xl font-bold">{t('onboardingModal.congratulation')}</div>
          <div className="pb-1">{t('onboardingModal.formIntro')}</div>
          <div>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-wrap"></div>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-1/2 lg:pr-3">
                    <FormFieldRow<Inputs>
                      label={t('common:employmentStatus')}
                      name="employment"
                      type="select"
                      options={employmentSelectFormOptions}
                      formColor="text-edu-black"
                    />
                  </div>
                </div>
                {universityVisible && (
                  <div className="flex flex-wrap">
                    <div className="w-full lg:w-1/2 lg:pr-3">
                      <FormFieldRow<Inputs>
                        label={t('common:university')}
                        name="university"
                        type="select"
                        options={universitySelectFormOptions}
                        formColor="text-edu-black"
                      />
                    </div>
                    <div className="w-full lg:w-1/2 lg:pl-3">
                      {watchUniversity === University_enum.CAU_KIEL && (
                        <FormFieldRow<Inputs>
                          label={t('common:matriculationNumber')}
                          name="matriculationNumber"
                          formColor="text-edu-black"
                          required={universityVisible && watchUniversity === University_enum.CAU_KIEL}
                        />
                      )}
                    </div>
                  </div>
                )}
                {otherUniversityVisible && (
                  <div className="w-full lg:w-1/2">
                    <FormFieldRow<Inputs>
                      label={otherUniversityLabel}
                      name="otherUniversity"
                      formColor="text-edu-black"
                    />
                  </div>
                )}
                <div className="pb-3">{t('onboardingModal.confirmSufficientTime')}</div>
                <div className="pb-3">
                  <b>{t('onboardingModal.mattermostInfo1')}</b>
                </div>
                <div className="pb-0">{t('onboardingModal.mattermostInfo2')}</div>
                <div className="flex flex-col lg:flex-row lg:gap-5">
                  <Button
                    as="button"
                    type="button"
                    disabled={isSubmitting}
                    filled
                    inverted
                    className="mt-8 block mx-auto lg:mb-5 disabled:bg-slate-500"
                    onClick={() => {
                      setShowDeclineDialog(true);
                    }}
                  >
                    {isSubmitting ? <CircularProgress /> : t('reject')}
                  </Button>
                  <Button
                    as="button"
                    type="submit"
                    disabled={isSubmitting}
                    filled
                    className="mt-4 lg:mt-8 block mx-auto lg:mb-5 disabled:bg-slate-500"
                  >
                    {isSubmitting ? <CircularProgress /> : t('confirm')}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
          <QuestionConfirmationDialog
            onClose={(isDeclined) => onDeclineDialogClose(isDeclined)}
            open={showDeclineDialog}
            confirmationText={t('onboardingModal.declineButtonText')}
            question={t('onboardingModal.declineConfirmText')}
          />
        </>
      )}
    </div>
  );
};

export default Onboarding;
